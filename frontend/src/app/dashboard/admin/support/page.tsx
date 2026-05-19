'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MessageSquare, Send, CheckCircle, Clock, AlertTriangle, ChevronLeft, ChevronRight,
  Filter, Search
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  admin?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  replies: Array<{
    id: string;
    message: string;
    isAdmin: boolean;
    createdAt: string;
    user: {
      firstName: string;
      lastName: string;
    };
  }>;
}

export default function AdminSupportPage() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [page, statusFilter, priorityFilter, categoryFilter, search]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (search) params.search = search;

      const response = await adminApi.getSupportTickets(params);
      setTickets(response.data.data.tickets);
      setTotal(response.data.data.total);
    } catch (error: any) {
      toast({
        title: 'Error loading tickets',
        description: error.response?.data?.message || 'Failed to load tickets',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    try {
      await adminApi.updateSupportTicket(ticketId, { status });
      toast({ title: 'Ticket status updated successfully' });
      loadTickets();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update ticket status',
        variant: 'destructive',
      });
    }
  };

  const handleAssignTicket = async (ticketId: string) => {
    try {
      await adminApi.assignSupportTicket(ticketId);
      toast({ title: 'Ticket assigned successfully' });
      loadTickets();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to assign ticket',
        variant: 'destructive',
      });
    }
  };

  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setShowReplyModal(true);
  };

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    
    try {
      setSendingReply(true);
      await adminApi.replyToSupportTicket(selectedTicket.id, { message: replyMessage });
      toast({ title: 'Reply sent successfully' });
      setReplyMessage('');
      setShowReplyModal(false);
      loadTickets();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send reply',
        variant: 'destructive',
      });
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-700';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-700';
      case 'RESOLVED': return 'bg-green-100 text-green-700';
      case 'CLOSED': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-700';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
      case 'LOW': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const openTickets = tickets.filter(t => t.status === 'OPEN').length;
  const inProgressTickets = tickets.filter(t => t.status === 'IN_PROGRESS').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Support & Ticketing</h1>
          <p className="text-gray-500">Manage user support tickets</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tickets..."
              className="pr-10 w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="border rounded-md px-3 py-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select
            className="border rounded-md px-3 py-2"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="Open Tickets"
          value={openTickets}
          icon={MessageSquare}
          color="bg-blue-500"
        />
        <SummaryCard
          title="In Progress"
          value={inProgressTickets}
          icon={Clock}
          color="bg-yellow-500"
        />
        <SummaryCard
          title="Resolved"
          value={tickets.filter(t => t.status === 'RESOLVED').length}
          icon={CheckCircle}
          color="bg-green-500"
        />
      </div>

      {/* Tickets Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nebula-600 mx-auto"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50 dark:bg-gray-800">
                      <th className="text-right py-3 px-4 font-medium">Subject</th>
                      <th className="text-right py-3 px-4 font-medium">User</th>
                      <th className="text-right py-3 px-4 font-medium">Category</th>
                      <th className="text-right py-3 px-4 font-medium">Priority</th>
                      <th className="text-right py-3 px-4 font-medium">Status</th>
                      <th className="text-right py-3 px-4 font-medium">Assigned To</th>
                      <th className="text-right py-3 px-4 font-medium">Created</th>
                      <th className="text-right py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket) => (
                      <tr key={ticket.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-4 px-4">
                          <p className="font-medium">{ticket.subject}</p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">{ticket.description}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm">{ticket.user.firstName} {ticket.user.lastName}</p>
                          <p className="text-xs text-gray-500">{ticket.user.email}</p>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm">{ticket.category}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${getPriorityBadgeColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {ticket.admin ? (
                            <span className="text-sm">{ticket.admin.firstName}</span>
                          ) : (
                            <span className="text-gray-400 text-sm">Unassigned</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">
                          {formatDate(ticket.createdAt)}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewTicket(ticket)}
                            >
                              View
                            </Button>
                            {!ticket.admin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAssignTicket(ticket.id)}
                              >
                                Assign
                              </Button>
                            )}
                            {ticket.status === 'OPEN' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateTicketStatus(ticket.id, 'IN_PROGRESS')}
                              >
                                <Clock className="w-4 h-4" />
                              </Button>
                            )}
                            {ticket.status === 'IN_PROGRESS' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateTicketStatus(ticket.id, 'RESOLVED')}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-gray-500">
                  Total: {total} tickets
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <span className="px-3 py-2">{page}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page * 20 >= total}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Reply Modal */}
      {showReplyModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">{selectedTicket.subject}</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowReplyModal(false)}>
                ✕
              </Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{selectedTicket.user.firstName} {selectedTicket.user.lastName}</span>
                    <span className="text-xs text-gray-500">{formatDate(selectedTicket.createdAt)}</span>
                  </div>
                  <p className="text-sm">{selectedTicket.description}</p>
                </div>

                {selectedTicket.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className={`p-4 rounded-lg ${reply.isAdmin ? 'bg-blue-50 dark:bg-blue-900/20 ml-8' : 'bg-gray-50 dark:bg-gray-700'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">
                        {reply.user.firstName} {reply.user.lastName}
                        {reply.isAdmin && ' (Admin)'}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(reply.createdAt)}</span>
                    </div>
                    <p className="text-sm">{reply.message}</p>
                  </div>
                ))}

                <div className="border-t pt-4">
                  <textarea
                    className="w-full border rounded-md p-3 min-h-[100px]"
                    placeholder="Type your reply..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      onClick={handleReply}
                      disabled={sendingReply || !replyMessage.trim()}
                    >
                      {sendingReply ? (
                        'Sending...'
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Reply
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, color }: {
  title: string;
  value: number;
  icon: any;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
