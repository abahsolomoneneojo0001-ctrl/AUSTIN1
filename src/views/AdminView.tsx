import React, { useState, useEffect } from 'react';
import { Users, Calendar, Activity, LogOut, TrendingUp, Search, MessageSquare, Trash2, Shield, Send, X } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, activeToday: 0, premiumUsers: 0 });

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
      const usersData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserData[];
      setUsers(usersData);
      setStats({
        totalUsers: usersData.length,
        activeToday: usersData.filter(u => u.stats?.totalWorkouts! > 0).length,
        premiumUsers: Math.floor(usersData.length * 0.6)
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
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      const updated = users.map(u => u.uid === userId ? { ...u, role: newRole } : u);
      setUsers(updated);
      if (selectedUser?.uid === userId) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-[100dvh] bg-ff-bg text-ff-text font-sans flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-ff-surface border-r border-ff-surface p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 rounded-xl bg-ff-primary flex items-center justify-center">
            <Activity className="w-5 h-5 text-black" />
          </div>
          <span className="text-2xl font-display tracking-wider text-ff-text">FWA ADMIN</span>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'dashboard', label: 'Overview', icon: TrendingUp },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'messages', label: 'Messages', icon: MessageSquare },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                activeTab === tab.id ? "bg-ff-primary text-black" : "text-ff-muted hover:text-ff-text hover:bg-ff-surface"
              )}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>

        <button
          onClick={onLogout}
          className="mt-auto w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            <header className="mb-12">
              <h1 className="text-4xl font-display tracking-wide text-ff-text mb-2">Admin Dashboard</h1>
              <p className="text-ff-muted">Manage your users, interactions, and app metrics.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {[
                { label: 'Total Users', value: stats.totalUsers, change: '+12% this month' },
                { label: 'Active Today', value: stats.activeToday, change: 'Last 24 hours' },
                { label: 'Premium Users', value: stats.premiumUsers, change: '+5% this month' },
              ].map((stat, i) => (
                <div key={i} className="bg-ff-surface p-6 rounded-2xl border border-ff-surface">
                  <p className="text-sm text-ff-muted font-bold uppercase tracking-wider mb-2">{stat.label}</p>
                  <p className="text-4xl font-mono font-bold text-ff-text mb-2">{stat.value}</p>
                  <p className="text-sm text-ff-primary font-bold">{stat.change}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <header className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-4xl font-display tracking-wide text-ff-text mb-2">Users Management</h1>
                <p className="text-ff-muted">View and manage all users in the system.</p>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ff-muted" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-ff-surface border border-ff-surface rounded-xl py-2.5 pl-10 pr-4 text-ff-text placeholder:text-ff-muted focus:outline-none focus:border-ff-primary focus:ring-1 focus:ring-ff-primary transition-all"
                />
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Users Table */}
              <div className="lg:col-span-2 bg-ff-surface rounded-2xl border border-ff-surface overflow-hidden">
                <div className="p-6 border-b border-ff-surface">
                  <h2 className="text-xl font-display tracking-wide text-ff-text">All Users ({filteredUsers.length})</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-ff-surface/50 text-xs uppercase tracking-wider text-ff-muted font-bold">
                      <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Workouts</th>
                        <th className="px-6 py-4">Joined</th>
                        <th className="px-6 py-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ff-surface">
                      {filteredUsers.map((user) => (
                        <tr key={user.uid} className="hover:bg-ff-surface/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ff-primary to-ff-quaternary flex items-center justify-center text-black font-bold text-xs">
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <p className="font-bold text-ff-text">{user.name}</p>
                                <p className="text-xs text-ff-muted">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-ff-text">{user.stats?.totalWorkouts || 0}</td>
                          <td className="px-6 py-4 text-sm text-ff-muted">{user.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="text-sm font-bold text-ff-primary hover:text-ff-text transition-colors"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* User Details Panel */}
              {selectedUser && (
                <div className="bg-ff-surface rounded-2xl border border-ff-surface p-6 h-fit sticky top-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-display tracking-wide text-ff-text">User Details</h3>
                    <button onClick={() => setSelectedUser(null)} className="text-ff-muted hover:text-ff-text">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-xs text-ff-muted uppercase font-bold mb-2">Name</p>
                      <p className="font-bold text-ff-text">{selectedUser.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ff-muted uppercase font-bold mb-2">Email</p>
                      <p className="font-mono text-sm text-ff-text">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ff-muted uppercase font-bold mb-2">Total Workouts</p>
                      <p className="font-bold text-ff-text">{selectedUser.stats?.totalWorkouts || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ff-muted uppercase font-bold mb-2">Total Minutes</p>
                      <p className="font-bold text-ff-text">{selectedUser.stats?.totalMinutes || 0}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <button
                      onClick={() => updateUserRole(selectedUser.uid, 'premium')}
                      className="w-full flex items-center justify-center gap-2 bg-ff-primary text-black py-2 rounded-lg font-bold hover:bg-ff-primary/90 transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      Mark as Premium
                    </button>
                    <button
                      onClick={() => deleteUser(selectedUser.uid)}
                      className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-500 py-2 rounded-lg font-bold hover:bg-red-500/20 transition-colors"
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
            <header className="mb-8">
              <h1 className="text-4xl font-display tracking-wide text-ff-text mb-2">User Messages</h1>
              <p className="text-ff-muted">Send messages and announcements to users.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Users List */}
              <div className="lg:col-span-1 bg-ff-surface rounded-2xl border border-ff-surface overflow-hidden">
                <div className="p-6 border-b border-ff-surface">
                  <h2 className="text-xl font-display tracking-wide text-ff-text">Users</h2>
                </div>
                <div className="overflow-y-auto max-h-[600px]">
                  {users.map((user) => (
                    <button
                      key={user.uid}
                      onClick={() => setSelectedUser(user)}
                      className={cn(
                        "w-full text-left px-6 py-4 border-b border-ff-surface/50 hover:bg-ff-surface/30 transition-colors",
                        selectedUser?.uid === user.uid ? "bg-ff-primary/10 border-l-2 border-ff-primary" : ""
                      )}
                    >
                      <p className="font-bold text-ff-text text-sm">{user.name}</p>
                      <p className="text-xs text-ff-muted">{user.email}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages Panel */}
              {selectedUser ? (
                <div className="lg:col-span-2 bg-ff-surface rounded-2xl border border-ff-surface overflow-hidden flex flex-col h-[600px]">
                  <div className="p-6 border-b border-ff-surface">
                    <h2 className="text-xl font-display tracking-wide text-ff-text">Messages with {selectedUser.name}</h2>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.length === 0 ? (
                      <p className="text-ff-muted text-center py-8">No messages yet. Start a conversation!</p>
                    ) : (
                      messages.map((msg) => (
                        <div key={msg.id} className={cn("flex gap-3", msg.from === 'admin' ? 'flex-row-reverse' : '')}>
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                            msg.from === 'admin' ? "bg-ff-primary text-black" : "bg-ff-surface/50"
                          )}>
                            {msg.from === 'admin' ? 'A' : 'U'}
                          </div>
                          <div className={cn(
                            "max-w-[70%] p-3 rounded-lg",
                            msg.from === 'admin'
                              ? "bg-ff-primary/20 text-ff-text rounded-br-none"
                              : "bg-ff-surface text-ff-text rounded-bl-none"
                          )}>
                            <p className="text-sm">{msg.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={sendMessage} className="border-t border-ff-surface p-4 flex gap-3">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-ff-bg border border-ff-surface rounded-lg px-4 py-2 text-ff-text placeholder:text-ff-muted focus:outline-none focus:border-ff-primary transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!messageInput.trim()}
                      className="bg-ff-primary text-black p-2 rounded-lg hover:bg-ff-primary/90 disabled:opacity-50 transition-all"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              ) : (
                <div className="lg:col-span-2 bg-ff-surface rounded-2xl border border-ff-surface p-8 flex items-center justify-center h-[600px]">
                  <p className="text-ff-muted text-center">Select a user to start messaging</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
