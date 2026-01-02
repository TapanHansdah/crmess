import { placeholderImages } from '@/lib/placeholder-images';

const getAvatar = (index) =>
  placeholderImages[index % 6]?.imageUrl || placeholderImages[0]?.imageUrl;

export const contacts = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'alice.j@example.com',
    company: 'Innovate Inc.',
    title: 'CEO',
    phone: '123-456-7890',
    status: 'customer',
    avatarUrl: getAvatar(0),
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'bob.s@example.com',
    company: 'Solutions Co.',
    title: 'CTO',
    phone: '234-567-8901',
    status: 'customer',
    avatarUrl: getAvatar(1),
  },
  {
    id: '3',
    name: 'Charlie Brown',
    email: 'charlie.b@example.com',
    company: 'Tech Gadgets',
    title: 'Lead Developer',
    phone: '345-678-9012',
    status: 'lead',
    avatarUrl: getAvatar(2),
  },
  {
    id: '4',
    name: 'Diana Prince',
    email: 'diana.p@example.com',
    company: 'Stark Industries',
    title: 'Marketing Head',
    phone: '456-789-0123',
    status: 'lead',
    avatarUrl: getAvatar(3),
  },
  {
    id: '5',
    name: 'Ethan Hunt',
    email: 'ethan.h@example.com',
    company: 'Global Dynamics',
    title: 'Operations Manager',
    phone: '567-890-1234',
    status: 'customer',
    avatarUrl: getAvatar(4),
  },
  {
    id: '6',
    name: 'Fiona Glenanne',
    email: 'fiona.g@example.com',
    company: 'Cyber Systems',
    title: 'Security Consultant',
    phone: '678-901-2345',
    status: 'archived',
    avatarUrl: getAvatar(5),
  },
];

export const dealStages = [
  'New Lead',
  'Contacted',
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Lost',
];

export const deals = [
  {
    id: 'd1',
    title: 'Website Redesign',
    contactId: '3',
    stage: 'Proposal Sent',
    value: 25000,
    closeDate: '2024-08-15',
  },
  {
    id: 'd2',
    title: 'Mobile App Development',
    contactId: '4',
    stage: 'Contacted',
    value: 50000,
    closeDate: '2024-09-01',
  },
  {
    id: 'd3',
    title: 'Cloud Migration',
    contactId: '1',
    stage: 'Won',
    value: 75000,
    closeDate: '2024-07-20',
  },
  {
    id: 'd4',
    title: 'SEO Optimization',
    contactId: '2',
    stage: 'Negotiation',
    value: 10000,
    closeDate: '2024-07-30',
  },
  {
    id: 'd5',
    title: 'New Hardware Purchase',
    contactId: '5',
    stage: 'Lost',
    value: 30000,
    closeDate: '2024-07-10',
  },
  {
    id: 'd6',
    title: 'E-commerce Platform',
    contactId: '3',
    stage: 'New Lead',
    value: 40000,
    closeDate: '2024-10-01',
  },
];

export const tasks = [
  {
    id: 't1',
    title: 'Follow up with Charlie',
    dueDate: '2024-07-28',
    status: 'To Do',
    assignedTo: '2',
    relatedDealId: 'd1',
  },
  {
    id: 't2',
    title: 'Prepare proposal for Diana',
    dueDate: '2024-07-29',
    status: 'In Progress',
    assignedTo: '1',
    relatedDealId: 'd2',
  },
  {
    id: 't3',
    title: 'Send invoice for Cloud Migration',
    dueDate: '2024-07-25',
    status: 'Done',
    assignedTo: '1',
    relatedDealId: 'd3',
  },
  {
    id: 't4',
    title: 'Schedule negotiation call with Bob',
    dueDate: '2024-07-26',
    status: 'To Do',
    assignedTo: '2',
    relatedDealId: 'd4',
  },
];

export const salesData = [
  { month: 'Jan', sales: 4000 },
  { month: 'Feb', sales: 3000 },
  { month: 'Mar', sales: 5000 },
  { month: 'Apr', sales: 4500 },
  { month: 'May', sales: 6000 },
  { month: 'Jun', sales: 5500 },
  { month: 'Jul', sales: 7000 },
];
