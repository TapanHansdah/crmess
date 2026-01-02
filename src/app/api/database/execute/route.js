import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { sql, userId } = body;

    if (!sql || typeof sql !== 'string') {
      return Response.json(
        { error: 'SQL query is required' },
        { status: 400 }
      );
    }

    // Get user_id from request (from body or extract from auth header if available)
    let currentUserId = userId;
    if (!currentUserId) {
      // Try to extract from Authorization header if present
      const authHeader = request.headers.get('Authorization');
      // This is a placeholder - actual implementation depends on your auth system
      // For now, we'll require userId in body
    }

    // Remove comments and get clean SQL
    const cleanedSql = sql
      .replace(/--.*$/gm, '')  // Remove -- comments
      .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove /* */ comments
      .trim();

    // Split by semicolon to handle multiple statements
    const statements = cleanedSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    if (statements.length === 0) {
      return Response.json(
        { error: 'No valid SQL statements found' },
        { status: 400 }
      );
    }

    // Check if all statements are allowed operations
    const allowedOperations = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
    for (const stmt of statements) {
      const upperStmt = stmt.toUpperCase();
      const isAllowed = allowedOperations.some(op => upperStmt.startsWith(op));
      if (!isAllowed) {
        return Response.json(
          { error: `Only SELECT, INSERT, UPDATE, DELETE operations are allowed. Found: ${upperStmt.split(/\s+/)[0]}` },
          { status: 400 }
        );
      }
    }

    // Execute all statements and log them
    const results = [];
    for (const stmt of statements) {
      const upperStmt = stmt.toUpperCase();
      
      if (upperStmt.startsWith('SELECT')) {
        const result = await executeSelect(stmt);
        results.push(result);
      } else if (upperStmt.startsWith('INSERT')) {
        const result = await executeInsert(stmt);
        results.push(result);
        
        // Log INSERT operation
        if (currentUserId && result.table && result.data && result.data.length > 0) {
          await logAuditAndNotify(currentUserId, result.table, 'create', result.data[0]);
        }
      } else if (upperStmt.startsWith('UPDATE')) {
        return Response.json(
          { error: 'UPDATE queries via SQL are not yet supported. Please use the UI.' },
          { status: 400 }
        );
      } else if (upperStmt.startsWith('DELETE')) {
        return Response.json(
          { error: 'DELETE queries are disabled for safety.' },
          { status: 400 }
        );
      }
    }

    // For single statements, return flattened response for backward compatibility
    if (results.length === 1) {
      const result = results[0];
      return Response.json({
        success: true,
        message: `Executed successfully`,
        rowCount: result.rowCount,
        data: result.data,
        type: result.type,
        table: result.table,
      });
    }

    // For multiple statements, return as array
    return Response.json({
      success: true,
      message: `Executed ${statements.length} statement(s) successfully`,
      results: results
    });
  } catch (error) {
    console.error('SQL execution error:', error);
    return Response.json(
      { error: error.message || 'Failed to execute SQL' },
      { status: 500 }
    );
  }
}

// Helper function to execute SELECT
async function executeSelect(sql) {
  console.log('\n🔵 EXECUTING SELECT:');
  console.log('   SQL:', sql.substring(0, 100) + '...');
  
  const tableMatch = sql.match(/FROM\s+([\w.]+)/i);
  const table = tableMatch ? tableMatch[1].split('.').pop() : null;

  if (!table) {
    throw new Error('Could not determine table from SELECT query');
  }

  console.log('   Table:', table);

  // Extract WHERE clause if present
  const whereMatch = sql.match(/WHERE\s+(.+?)(?:ORDER\s+BY|LIMIT|$)/i);
  const whereClause = whereMatch ? whereMatch[1].trim() : null;
  
  console.log('   WHERE clause:', whereClause);

  let query = supabase.from(table).select('*');

  // Apply WHERE clause if present
  if (whereClause) {
    // Parse simple WHERE conditions (column = value)
    const conditions = whereClause.split(/\s+AND\s+/i);
    
    for (const condition of conditions) {
      // Handle: column = 'value' or column = number or column like 'pattern'
      const eqMatch = condition.match(/(\w+)\s*=\s*['"]?([^'"]+)['"]?/i);
      const likeMatch = condition.match(/(\w+)\s+like\s+['"]([^'"]+)['"]/i);
      const inMatch = condition.match(/(\w+)\s+IN\s*\(\s*(.+?)\s*\)/i);
      
      if (eqMatch) {
        const [, col, val] = eqMatch;
        const cleanVal = val.trim().replace(/['"]/g, '');
        query = query.eq(col, isNaN(cleanVal) ? cleanVal : Number(cleanVal));
        console.log(`   Applied filter: ${col} = ${cleanVal}`);
      } else if (likeMatch) {
        const [, col, pattern] = likeMatch;
        query = query.ilike(col, `%${pattern}%`);
        console.log(`   Applied filter: ${col} LIKE %${pattern}%`);
      } else if (inMatch) {
        const [, col, values] = inMatch;
        const valArray = values.split(',').map(v => v.trim().replace(/['"]/g, ''));
        query = query.in(col, valArray);
        console.log(`   Applied filter: ${col} IN (${valArray.join(', ')})`);
      }
    }
  }

  // Apply ORDER BY if present
  const orderMatch = sql.match(/ORDER\s+BY\s+(\w+)(?:\s+(ASC|DESC))?/i);
  if (orderMatch) {
    const [, col, dir] = orderMatch;
    query = query.order(col, { ascending: dir?.toUpperCase() !== 'DESC' });
    console.log(`   Applied order: ${col} ${dir || 'ASC'}`);
  }

  // Apply LIMIT if present
  const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
  if (limitMatch) {
    const [, limit] = limitMatch;
    query = query.limit(Number(limit));
    console.log(`   Applied limit: ${limit}`);
  }

  const { data, error } = await query;

  console.log('   SELECT result:', { rowCount: data?.length || 0, firstRow: data?.[0] });

  if (error) throw error;
  return { type: 'SELECT', table, rowCount: data?.length || 0, data: data || [] };
}

// Helper function to execute INSERT
async function executeInsert(sql) {
  console.log('\n🔵 EXECUTING INSERT:');
  console.log('   SQL:', sql.substring(0, 100) + '...');
  
  const tableMatch = sql.match(/INTO\s+([\w.]+)/i);
  const fullTable = tableMatch ? tableMatch[1] : null;
  const table = fullTable ? fullTable.split('.').pop() : null;

  if (!table) {
    throw new Error('Could not determine table from INSERT query');
  }

  console.log('   Table:', table);

  // Match columns - look for pattern: ( col1, col2, ... ) VALUES
  const columnsMatch = sql.match(/\(\s*([^)]+)\s*\)\s+VALUES/i);
  if (!columnsMatch) {
    throw new Error('Invalid INSERT syntax - could not find column list');
  }
  
  const columns = columnsMatch[1].split(',').map(c => c.trim());
  
  // Find VALUES keyword and extract everything after it
  const valuesIndex = sql.toUpperCase().indexOf('VALUES');
  if (valuesIndex === -1) {
    throw new Error('Invalid INSERT syntax - VALUES keyword not found');
  }
  
  let valueString = sql.substring(valuesIndex + 6).trim();
  
  // Remove RETURNING clause if present
  valueString = valueString.replace(/RETURNING\s+.*/i, '').trim();
  
  // Extract the main parentheses content
  if (!valueString.startsWith('(')) {
    throw new Error('Invalid INSERT syntax - VALUES not followed by parentheses');
  }
  
  // Find matching closing parenthesis
  let depth = 0;
  let inQuote = false;
  let quoteChar = '';
  let endIndex = -1;
  
  for (let i = 0; i < valueString.length; i++) {
    const char = valueString[i];
    
    if ((char === "'" || char === '"') && (i === 0 || valueString[i - 1] !== '\\')) {
      if (!inQuote) {
        inQuote = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuote = false;
      }
    }
    
    if (!inQuote) {
      if (char === '(') {
        depth++;
      } else if (char === ')') {
        depth--;
        if (depth === 0) {
          endIndex = i;
          break;
        }
      }
    }
  }
  
  if (endIndex === -1) {
    throw new Error('Invalid INSERT syntax - unmatched parentheses in VALUES');
  }
  
  valueString = valueString.substring(1, endIndex).trim();
  
  // Parse values - handle nested parentheses for subqueries
  const values = [];
  let current = '';
  let depth2 = 0;
  let inQuote2 = false;
  let quoteChar2 = '';

  for (let i = 0; i < valueString.length; i++) {
    const char = valueString[i];
    
    if ((char === "'" || char === '"') && (i === 0 || valueString[i - 1] !== '\\')) {
      if (!inQuote2) {
        inQuote2 = true;
        quoteChar2 = char;
      } else if (char === quoteChar2) {
        inQuote2 = false;
      }
    }

    if (!inQuote2) {
      if (char === '(') depth2++;
      else if (char === ')') depth2--;
      else if (char === ',' && depth2 === 0) {
        values.push(current.trim());
        current = '';
        continue;
      }
    }

    current += char;
  }
  if (current.trim()) values.push(current.trim());

  // Process each value
  const processedValues = [];
  for (let val of values) {
    val = val.trim();
    
    // Check if it's a SELECT subquery
    if (val.toUpperCase().startsWith('(SELECT')) {
      const selectQuery = val.slice(1, -1); // Remove outer parens
      const result = await executeSelect(selectQuery);
      if (result.data && result.data.length > 0) {
        // Get the first column of the first row
        const firstRow = result.data[0];
        const firstValue = Object.values(firstRow)[0];
        processedValues.push(firstValue);
      } else {
        throw new Error(`Subquery returned no results: ${selectQuery}`);
      }
    } else if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
      processedValues.push(val.slice(1, -1));
    } else if (val.toLowerCase() === 'true') {
      processedValues.push(true);
    } else if (val.toLowerCase() === 'false') {
      processedValues.push(false);
    } else if (val.toLowerCase() === 'null') {
      processedValues.push(null);
    } else if (val.toLowerCase() === 'now()' || val.toLowerCase().includes('current_timestamp')) {
      processedValues.push(new Date().toISOString());
    } else if (val.toLowerCase().includes('current_date')) {
      processedValues.push(new Date().toISOString().split('T')[0]);
    } else if (val.toLowerCase().includes('interval')) {
      const intervalMatch = val.match(/CURRENT_TIMESTAMP\s*-\s*INTERVAL\s*'(\d+)\s+(\w+)'/i);
      if (intervalMatch) {
        const date = new Date();
        const amount = parseInt(intervalMatch[1]);
        const unit = intervalMatch[2].toLowerCase();
        if (unit === 'days') date.setDate(date.getDate() - amount);
        else if (unit === 'hours') date.setHours(date.getHours() - amount);
        processedValues.push(date.toISOString());
      } else {
        processedValues.push(new Date().toISOString());
      }
    } else if (!isNaN(val) && val !== '') {
      processedValues.push(Number(val));
    } else {
      processedValues.push(val);
    }
  }

  if (columns.length !== processedValues.length) {
    throw new Error(`Column count (${columns.length}) does not match value count (${processedValues.length})`);
  }

  console.log('   Columns:', columns);
  console.log('   Processed Values:', processedValues);

  const record = {};
  columns.forEach((col, i) => {
    record[col] = processedValues[i];
  });

  console.log('   Record to insert:', JSON.stringify(record, null, 2));

  const { data, error } = await supabase
    .from(table)
    .insert([record])
    .select();

  console.log('   Insert response:', { data, error });

  if (error) throw error;
  return { type: 'INSERT', table, rowCount: data?.length || 0, data: data || [] };
}
// Helper function to log audit trail and create notifications
async function logAuditAndNotify(userId, tableName, action, entityData) {
  try {
    // Extract entity name from the data
    let entityName = 'Record';
    if (tableName === 'contacts' && entityData.first_name) {
      entityName = `${entityData.first_name} ${entityData.last_name || ''}`.trim();
    } else if (tableName === 'leads' && entityData.company) {
      entityName = entityData.company;
    } else if (tableName === 'products' && entityData.name) {
      entityName = entityData.name;
    } else if (tableName === 'organizations' && entityData.name) {
      entityName = entityData.name;
    } else if (entityData.name) {
      entityName = entityData.name;
    } else if (entityData.title) {
      entityName = entityData.title;
    }

    // Log to audit_logs table
    const auditLogEntry = {
      user_id: userId,
      table_name: tableName,
      action: action,
      entity_type: tableName.charAt(0).toUpperCase() + tableName.slice(1),
      entity_name: entityName,
      details: JSON.stringify(entityData),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert([auditLogEntry]);

    if (auditError) {
      console.warn('Failed to log audit trail:', auditError);
    } else {
      console.log('✅ Audit log created:', entityName);
    }

    // Create notification
    const notificationMessage = formatNotificationMessage(action, tableName, entityName);
    const notification = {
      user_id: userId,
      type: action,
      title: notificationMessage.title,
      message: notificationMessage.message,
      entity_type: tableName,
      entity_id: entityData.id || null,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    const { error: notifError } = await supabase
      .from('notifications')
      .insert([notification]);

    if (notifError) {
      console.warn('Failed to create notification:', notifError);
    } else {
      console.log('✅ Notification created:', notificationMessage.title);
    }

  } catch (error) {
    console.error('Error logging audit/notification:', error);
    // Don't throw - we don't want to fail the operation if logging fails
  }
}

// Helper function to format notification messages
function formatNotificationMessage(action, tableName, entityName) {
  const actionText = {
    create: 'created',
    update: 'updated',
    delete: 'deleted',
  }[action] || action;

  const entityText = tableName.slice(0, -1); // Remove trailing 's'
  const title = `${entityText.charAt(0).toUpperCase() + entityText.slice(1)} ${actionText}`;
  const message = `${entityName} has been ${actionText} successfully`;

  return { title, message };
}