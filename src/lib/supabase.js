import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables. Please check your .env.local file.')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY')
  // Don't throw immediately - allow server to start, but API routes will fail
  // This prevents the server from crashing on startup
}

// Client-side instance (use anon key)
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null

// Server-side instance (use service role key - only use on server)
export const supabaseServer = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// ============================================
// CONTACTS OPERATIONS
// ============================================

export const fetchContacts = async () => {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching contacts:', error.message || JSON.stringify(error))
    return []
  }
}

export const addContact = async (contact, userId = null) => {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .insert([contact])
      .select()

    if (error) throw error;
    
    // Log the creation to audit trail if userId is provided
    if (userId && data && data.length > 0) {
      const newContact = data[0];
      const contactName = `${newContact.first_name || ''} ${newContact.last_name || ''}`.trim();
      
      // Call the audit log API
      try {
        await fetch('/api/database/audit-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            tableName: 'contacts',
            action: 'create',
            entityName: contactName || `Contact #${newContact.id}`,
            entityId: newContact.id,
            changes: {},
            entityData: newContact,
          }),
        });
      } catch (auditError) {
        console.warn('Failed to log audit trail:', auditError);
      }
    }
    
    return data?.[0]
  } catch (error) {
    console.error('Error adding contact:', error.message || JSON.stringify(error))
    return null
  }
}

export const updateContact = async (id, contact, userId = null) => {
  try {
    // First, fetch the current contact to capture changes
    const { data: currentData } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('contacts')
      .update(contact)
      .eq('id', id)
      .select()

    if (error) throw error;
    
    // Log the update to audit trail if userId is provided
    if (userId && data && data.length > 0) {
      const updatedContact = data[0];
      const contactName = `${updatedContact.first_name || ''} ${updatedContact.last_name || ''}`.trim();
      
      const changes = {};
      if (currentData) {
        Object.keys(contact).forEach(key => {
          if (currentData[key] !== contact[key]) {
            changes[key] = {
              old: currentData[key],
              new: contact[key]
            };
          }
        });
      }

      // Call the audit log API
      try {
        await fetch('/api/database/audit-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            tableName: 'contacts',
            action: 'update',
            entityName: contactName || `Contact #${id}`,
            entityId: id,
            changes,
            entityData: updatedContact,
          }),
        });
      } catch (auditError) {
        console.warn('Failed to log audit trail:', auditError);
      }
    }
    
    return data?.[0]
  } catch (error) {
    console.error('Error updating contact:', error.message || JSON.stringify(error))
    return null
  }
}

export const deleteContact = async (id, userId = null) => {
  try {
    // Fetch contact data before deletion for logging
    const { data: contactData } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)

    if (error) throw error;
    
    // Log the deletion to audit trail if userId is provided
    if (userId && contactData) {
      const contactName = `${contactData.first_name || ''} ${contactData.last_name || ''}`.trim();
      
      try {
        await fetch('/api/database/audit-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            tableName: 'contacts',
            action: 'delete',
            entityName: contactName || `Contact #${id}`,
            entityId: id,
            changes: {},
            entityData: contactData,
          }),
        });
      } catch (auditError) {
        console.warn('Failed to log audit trail:', auditError);
      }
    }
    
    return true
  } catch (error) {
    console.error('Error deleting contact:', error.message || JSON.stringify(error))
    return false
  }
}

// ============================================
// LEADS OPERATIONS
// ============================================

export const fetchLeads = async () => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching leads:', error.message || JSON.stringify(error))
    return []
  }
}

export const addLead = async (lead) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .insert([lead])
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error adding lead:', error.message || JSON.stringify(error))
    return null
  }
}

export const updateLead = async (id, lead) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .update(lead)
      .eq('id', id)
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error updating lead:', error.message || JSON.stringify(error))
    return null
  }
}

export const deleteLead = async (id) => {
  try {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting lead:', error.message || JSON.stringify(error))
    return false
  }
}

// ============================================
// TASKS OPERATIONS
// ============================================

export const fetchTasks = async () => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching tasks:', error.message || JSON.stringify(error))
    return []
  }
}

export const addTask = async (task) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert([task])
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error adding task:', error.message || JSON.stringify(error))
    return null
  }
}

export const updateTask = async (id, task) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update(task)
      .eq('id', id)
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error updating task:', error.message || JSON.stringify(error))
    return null
  }
}

export const deleteTask = async (id) => {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting task:', error.message || JSON.stringify(error))
    return false
  }
}

// ============================================
// DEALS OPERATIONS
// ============================================

export const fetchDeals = async () => {
  try {
    const client = supabaseServer || supabase
    const { data, error } = await client
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching deals:', error.message || JSON.stringify(error))
    return []
  }
}

export const addDeal = async (deal) => {
  try {
    const client = supabaseServer || supabase
    const { data, error } = await client
      .from('deals')
      .insert([deal])
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error adding deal:', error.message || JSON.stringify(error))
    return null
  }
}

export const updateDeal = async (id, deal) => {
  try {
    const client = supabaseServer || supabase
    const { data, error } = await client
      .from('deals')
      .update(deal)
      .eq('id', id)
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error updating deal:', error.message || JSON.stringify(error))
    return null
  }
}

export const deleteDeal = async (id) => {
  try {
    const client = supabaseServer || supabase
    const { error } = await client
      .from('deals')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting deal:', error.message || JSON.stringify(error))
    return false
  }
}

// ============================================
// SALES DATA OPERATIONS
// ============================================

export const fetchSalesData = async () => {
  try {
    const client = supabaseServer || supabase
    const { data, error } = await client
      .from('sales')
      .select('*')
      .order('date', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching sales data:', error.message || JSON.stringify(error))
    return []
  }
}

// ============================================
// INVOICES OPERATIONS
// ============================================

export const fetchInvoices = async () => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching invoices:', error.message || JSON.stringify(error))
    return []
  }
}

// ============================================
// QUOTES OPERATIONS
// ============================================

export const fetchQuotes = async () => {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching quotes:', error.message || JSON.stringify(error))
    return []
  }
}

// ============================================
// PRODUCTS OPERATIONS
// ============================================

export const fetchProducts = async () => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching products:', error.message || JSON.stringify(error))
    return []
  }
}

export const addProduct = async (product, userId = null) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()

    if (error) throw error;
    
    // Log the creation to audit trail if userId is provided
    if (userId && data && data.length > 0) {
      const newProduct = data[0];
      
      // Call the audit log API
      try {
        await fetch('/api/database/audit-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            tableName: 'products',
            action: 'create',
            entityName: newProduct.name || `Product #${newProduct.id}`,
            entityId: newProduct.id,
            changes: {},
            entityData: newProduct,
          }),
        });
      } catch (auditError) {
        console.warn('Failed to log audit trail:', auditError);
        // Don't throw - we don't want to fail the add if logging fails
      }
    }
    
    return data?.[0]
  } catch (error) {
    console.error('Error adding product:', error.message || JSON.stringify(error))
    return null
  }
}

export const updateProduct = async (id, product, userId = null) => {
  try {
    // First, fetch the current product to capture changes
    const { data: currentData } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    // Update the product
    const { data, error } = await supabase
      .from('products')
      .update(product)
      .eq('id', id)
      .select()

    if (error) throw error;
    
    // Log the update to audit trail if userId is provided
    if (userId && data && data.length > 0) {
      const updatedProduct = data[0];
      const changes = {};
      
      // Calculate what changed
      if (currentData) {
        Object.keys(product).forEach(key => {
          if (currentData[key] !== product[key]) {
            changes[key] = {
              old: currentData[key],
              new: product[key]
            };
          }
        });
      }

      // Call the audit log API
      try {
        await fetch('/api/database/audit-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            tableName: 'products',
            action: 'update',
            entityName: updatedProduct.name || `Product #${id}`,
            entityId: id,
            changes,
            entityData: updatedProduct,
          }),
        });
      } catch (auditError) {
        console.warn('Failed to log audit trail:', auditError);
        // Don't throw - we don't want to fail the update if logging fails
      }
    }

    return data?.[0]
  } catch (error) {
    console.error('Error updating product:', error.message || JSON.stringify(error))
    return null
  }
}

export const deleteProduct = async (id) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting product:', error.message || JSON.stringify(error))
    return false
  }
}

// ============================================
// INVOICES CRUD OPERATIONS
// ============================================

export const addInvoice = async (invoice) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .insert([invoice])
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error adding invoice:', error.message || JSON.stringify(error))
    return null
  }
}

export const updateInvoice = async (id, invoice) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .update(invoice)
      .eq('id', id)
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error updating invoice:', error.message || JSON.stringify(error))
    return null
  }
}

export const deleteInvoice = async (id) => {
  try {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting invoice:', error.message || JSON.stringify(error))
    return false
  }
}

// ============================================
// QUOTES CRUD OPERATIONS
// ============================================

export const addQuote = async (quote) => {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .insert([quote])
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error adding quote:', error.message || JSON.stringify(error))
    return null
  }
}

export const updateQuote = async (id, quote) => {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .update(quote)
      .eq('id', id)
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error updating quote:', error.message || JSON.stringify(error))
    return null
  }
}

export const deleteQuote = async (id) => {
  try {
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting quote:', error.message || JSON.stringify(error))
    return false
  }
}

// ============================================
// EMAILS OPERATIONS
// ============================================

export const fetchEmails = async () => {
  try {
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching emails:', error.message || JSON.stringify(error))
    return []
  }
}

export const addEmail = async (email) => {
  try {
    const { data, error } = await supabase
      .from('emails')
      .insert([email])
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error adding email:', error.message || JSON.stringify(error))
    return null
  }
}

export const updateEmail = async (id, email) => {
  try {
    const { data, error } = await supabase
      .from('emails')
      .update(email)
      .eq('id', id)
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error updating email:', error.message || JSON.stringify(error))
    return null
  }
}

export const deleteEmail = async (id) => {
  try {
    const { error } = await supabase
      .from('emails')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting email:', error.message || JSON.stringify(error))
    return false
  }
}

// ============================================
// DOCUMENTS OPERATIONS
// ============================================

export const fetchDocuments = async () => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching documents:', error.message || JSON.stringify(error))
    return []
  }
}

export const addDocument = async (document) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .insert([document])
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error adding document:', error.message || JSON.stringify(error))
    return null
  }
}

export const updateDocument = async (id, document) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .update(document)
      .eq('id', id)
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error updating document:', error.message || JSON.stringify(error))
    return null
  }
}

export const deleteDocument = async (id) => {
  try {
    // Call server-side API to delete from storage (service role key must be used on server)
    const response = await fetch(`/api/documents/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to delete document');
    }

    console.log(`✓ Document deleted successfully (storage + database): ${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting document:', error.message || JSON.stringify(error))
    return false
  }
}

// ============================================
// ORGANIZATIONS OPERATIONS
// ============================================

export const fetchOrganizations = async () => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching organizations:', error.message || JSON.stringify(error))
    return []
  }
}

export const addOrganization = async (organization) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .insert([organization])
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error adding organization:', error.message || JSON.stringify(error))
    return null
  }
}

export const updateOrganization = async (id, organization) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .update(organization)
      .eq('id', id)
      .select()

    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error('Error updating organization:', error.message || JSON.stringify(error))
    return null
  }
}

export const deleteOrganization = async (id) => {
  try {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting organization:', error.message || JSON.stringify(error))
    return false
  }
}

// ============================================
// DASHBOARD METRICS (PRODUCTION GRADE)
// ============================================

export const getDashboardMetrics = async () => {
  try {
    const [leads, invoices, contacts] = await Promise.all([
      fetchLeads(),
      fetchInvoices(),
      fetchContacts()
    ])

    // Calculate metrics from leads (using leads as the primary data source)
    const wonLeads = leads.filter(l => l.stage === 'Won')
    const totalRevenue = wonLeads.reduce((sum, lead) => sum + (parseFloat(lead.value) || 0), 0)
    const activeLeads = leads.filter(l => l.is_active && l.stage !== 'Won' && l.stage !== 'Lost')
    const leadsWon = wonLeads.length

    return {
      totalRevenue: Math.round(totalRevenue),
      activeDeals: activeLeads.length,
      dealsWon: leadsWon,
      totalDeals: leads.length,
      winRate: leads.length > 0 ? Math.round((leadsWon / leads.length) * 100) : 0,
      totalInvoices: invoices.length,
      totalContacts: contacts.length
    }
  } catch (error) {
    console.error('Error calculating dashboard metrics:', error)
    return {
      totalRevenue: 0,
      activeDeals: 0,
      dealsWon: 0,
      totalDeals: 0,
      winRate: 0,
      totalInvoices: 0,
      totalContacts: 0
    }
  }
}

export const getSalesChartData = async () => {
  try {
    const leads = await fetchLeads()
    const invoices = await fetchInvoices()
    
    // Group invoices by month for better sales trend
    const monthlyData = {}
    invoices.forEach(invoice => {
      const date = new Date(invoice.issued_date || invoice.created_at)
      const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' })
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (parseFloat(invoice.amount) || 0)
    })

    // If no invoice data, use lead values grouped by expected close date
    if (Object.keys(monthlyData).length === 0) {
      leads.forEach(lead => {
        const date = new Date(lead.expected_close_date || lead.created_at)
        const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' })
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (parseFloat(lead.value) || 0)
      })
    }

    return Object.entries(monthlyData)
      .map(([month, amount]) => ({
        month,
        sales: Math.round(amount)
      }))
      .reverse()
      .slice(0, 6)
  } catch (error) {
    console.error('Error calculating sales chart data:', error)
    return []
  }
}

export const getDealStageData = async () => {
  try {
    const leads = await fetchLeads()
    
    // Group by stage
    const stageData = {}
    const stages = ['New Lead', 'Contacted', 'Proposal Sent', 'Negotiation', 'Won', 'Lost']
    
    leads.forEach(lead => {
      const stage = lead.stage || 'New Lead'
      stageData[stage] = (stageData[stage] || 0) + 1
    })

    return stages
      .map(stage => ({
        name: stage,
        value: stageData[stage] || 0,
        stage: stage.toLowerCase().replace(' ', '_')
      }))
      .filter(item => item.value > 0)
  } catch (error) {
    console.error('Error calculating deal stage data:', error)
    return []
  }
}

export const getLeadStageBreakdown = async () => {
  try {
    const leads = await fetchLeads()
    
    const breakdown = {}
    leads.forEach(lead => {
      const stage = lead.stage || 'New Lead'
      if (!breakdown[stage]) {
        breakdown[stage] = {
          count: 0,
          value: 0,
          probability: 0
        }
      }
      breakdown[stage].count += 1
      breakdown[stage].value += parseFloat(lead.value) || 0
      breakdown[stage].probability += lead.probability_percentage || 0
    })

    return Object.entries(breakdown).map(([stage, data]) => ({
      stage,
      ...data,
      avgProbability: Math.round(data.probability / data.count)
    }))
  } catch (error) {
    console.error('Error calculating lead stage breakdown:', error)
    return []
  }
}
