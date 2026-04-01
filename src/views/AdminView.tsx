import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, BarChart3, Settings, LogOut, Search, Filter, Trash2, Shield, Send, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

interface UserData {
  uid: string;
  email: string;
  name: string;
  role: string;
  stats?: {
    totalWorkouts: number;
    totalMinutes: number;
    caloriesBurned: number;
  };
  createdAt: any;
  status?: 'ACTIVE' | 'INACTIVE' | 'BANNED';
}

interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: any;
  read: boolean;
}

export default function AdminView({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, bannedUsers: 0 });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.uid);
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'user'));
      const snapshot = await getDocs(q);
      const usersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          ...data,
          status: data.status || ((data.stats?.totalWorkouts ?? 0) > 0 ? 'ACTIVE' : 'INACTIVE')
        };
      }) as UserData[];
      setUsers(usersData);
      setStats({
        totalUsers: usersData.length,
        activeUsers: usersData.filter(u => u.status === 'ACTIVE').length,
        bannedUsers: usersData.filter(u => u.status === 'BANNED').length
      });
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      const messagesRef = collection(db, 'messages');
      const q = query(messagesRef, where('to', '==', userId));
      const snapshot = await getDocs(q);
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(messagesData.sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis()));
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedUser) return;

    try {
      const messagesRef = collection(db, 'messages');
      await addDoc(messagesRef, {
        from: 'admin',
        to: selectedUser.uid,
        content: messageInput,
        timestamp: serverTimestamp(),
        read: false
      });
      setMessageInput('');
      fetchMessages(selectedUser.uid);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(users.filter(u => u.uid !== userId));
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const updateUserStatus = async (userId: string, newStatus: 'ACTIVE' | 'INACTIVE' | 'BANNED') => {
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
      const updated = users.map(u => u.uid === userId ? { ...u, status: newStatus } : u);
      setUsers(updated);
      if (selectedUser?.uid === userId) {
        setSelectedUser({ ...selectedUser, status: newStatus });
      }
      fetchUsers();
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'All') return matchesSearch;
    if (statusFilter === 'Active') return matchesSearch && u.status === 'ACTIVE';
    if (statusFilter === 'Inactive') return matchesSearch && (u.status === 'INACTIVE' || u.status === 'BANNED');
    return matchesSearch;
  });

  const getStatusColor = (status?: string) => {
    if (status === 'ACTIVE') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (status === 'BANNED') return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <div className="min-h-[100dvh] bg-gray-950 text-white font-sans flex">
      {/* Sidebar */}
      <aside className="w-64 bg-black border-r border-gray-800 p-8 flex flex-col">
        <div className="mb-12">
          <h1 className="text-2xl font-bold text-emerald-400">AUSTIN</h1>
          <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'users', label: 'Users', icon: Users },
            { id: 'messages', label: 'Messages', icon: MessageSquare },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left",
                activeTab === tab.id
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-900/50"
              )}
            >
              <tab.icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">User Management</h1>
              <p className="text-gray-400">Manage, message, and moderate users</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'text-emerald-400' },
                { label: 'Active', value: stats.activeUsers, icon: '✓', color: 'text-emerald-400' },
                { label: 'Banned', value: stats.bannedUsers, icon: '⛔', color: 'text-red-400' },
              ].map((stat, i) => (
                <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-500 uppercase text-xs tracking-widest font-bold">{stat.label}</p>
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                  <p className={cn("text-3xl font-bold", stat.color)}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Filter & Search */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-800 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                />
              </div>
              <div className="flex gap-2">
                {['All', 'Active', 'Inactive'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter as any)}
                    className={cn(
                      "px-6 py-3 rounded-lg font-medium transition-all border",
                      statusFilter === filter
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : "bg-gray-900/50 text-gray-400 border-gray-800 hover:border-gray-700"
                    )}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Users List */}
              <div className="lg:col-span-2 space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.uid}
                    onClick={() => setSelectedUser(user)}
                    className={cn(
                      "bg-gray-900/50 border rounded-xl p-4 cursor-pointer transition-all hover:border-emerald-500/50",
                      selectedUser?.uid === user.uid ? "border-emerald-500/50 bg-emerald-500/5" : "border-gray-800"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-sm font-bold text-black">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-white">{user.name}</p>
                          <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("px-3 py-1 rounded-full text-xs font-bold border uppercase", getStatusColor(user.status))}>
                          {user.status || 'INACTIVE'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* User Details Panel */}
              {selectedUser && (
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 h-fit sticky top-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold">User Details</h3>
                    <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold mb-2">Name</p>
                      <p className="font-bold text-white">{selectedUser.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold mb-2">Email</p>
                      <p className="font-mono text-sm text-gray-300">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold mb-2">Workouts</p>
                      <p className="font-bold text-emerald-400">{selectedUser.stats?.totalWorkouts || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-bold mb-2">Status</p>
                      <p className={cn("font-bold uppercase text-sm", selectedUser.status === 'ACTIVE' ? 'text-emerald-400' : 'text-gray-400')}>
                        {selectedUser.status || 'INACTIVE'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-gray-800 pt-4">
                    {selectedUser.status !== 'ACTIVE' && (
                      <button
                        onClick={() => updateUserStatus(selectedUser.uid, 'ACTIVE')}
                        className="w-full px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg font-bold hover:bg-emerald-500/30 transition-all border border-emerald-500/30 text-sm"
                      >
                        Activate User
                      </button>
                    )}
                    {selectedUser.status !== 'BANNED' && (
                      <button
                        onClick={() => updateUserStatus(selectedUser.uid, 'BANNED')}
                        className="w-full px-4 py-2 bg-red-500/20 text-red-400 rounded-lg font-bold hover:bg-red-500/30 transition-all border border-red-500/30 text-sm"
                      >
                        Ban User
                      </button>
                    )}
                    <button
                      onClick={() => deleteUser(selectedUser.uid)}
                      className="w-full px-4 py-2 bg-red-500/10 text-red-500 rounded-lg font-bold hover:bg-red-500/20 transition-all border border-red-500/20 text-sm flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete User
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div>
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">Messages</h1>
              <p className="text-gray-400">Send messages to users</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Users List */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-800">
                  <h3 className="font-bold">Users</h3>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {users.map((user) => (
                    <button
                      key={user.uid}
                      onClick={() => setSelectedUser(user)}
                      className={cn(
                        "w-full text-left px-4 py-3 border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors",
                        selectedUser?.uid === user.uid ? "bg-emerald-500/10 border-l-2 border-l-emerald-400" : ""
                      )}
                    >
                      <p className="font-bold text-sm text-white">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages Panel */}
              {selectedUser ? (
                <div className="lg:col-span-2 bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden flex flex-col h-[600px]">
                  <div className="p-4 border-b border-gray-800">
                    <h3 className="font-bold">Message {selectedUser.name}</h3>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No messages yet</p>
                    ) : (
                      messages.map((msg) => (
                        <div key={msg.id} className={cn("flex gap-3", msg.from === 'admin' ? 'flex-row-reverse' : '')}>
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white",
                            msg.from === 'admin' ? "bg-emerald-500" : "bg-gray-700"
                          )}>
                            {msg.from === 'admin' ? 'A' : 'U'}
                          </div>
                          <div className={cn(
                            "max-w-xs px-4 py-2 rounded-lg text-sm",
                            msg.from === 'admin'
                              ? "bg-emerald-500/20 text-emerald-100"
                              : "bg-gray-800 text-gray-100"
                          )}>
                            {msg.content}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={sendMessage} className="border-t border-gray-800 p-4 flex gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!messageInput.trim()}
                      className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-all"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              ) : (
                <div className="lg:col-span-2 bg-gray-900/50 border border-gray-800 rounded-xl p-8 flex items-center justify-center h-[600px]">
                  <p className="text-gray-500">Select a user to start messaging</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics & Settings (Placeholder) */}
        {(activeTab === 'analytics' || activeTab === 'settings') && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Coming soon...</p>
          </div>
        )}
      </main>
    </div>
  );
}
