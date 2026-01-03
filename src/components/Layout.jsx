import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { MessageSquare, Users, Radio, Settings, LogOut, Bell, Zap, Image, Layers, Gamepad2 } from 'lucide-react';

export default function Layout() {
    const location = useLocation();

    const getPageTitle = (path) => {
        switch (path) {
            case '/': return 'Inbox';
            case '/contacts': return 'Contacts';
            case '/broadcast': return 'Campaigns';
            case '/automation': return 'Automation';
            case '/media': return 'Media Library';
            case '/flows': return 'WhatsApp Flows';
            case '/playground': return 'Flow Playground';
            default: return 'Dashboard';
        }
    };

    const navClass = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${isActive
            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200/20'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`;

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            {/* Dark Sidebar */}
            <aside className="w-72 bg-slate-900 fixed h-full flex flex-col shadow-2xl z-10">
                <div className="p-8 pb-4">
                    <div className="flex items-center gap-3 text-emerald-500 mb-8">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-white">
                            Gateway<span className="text-emerald-500">CRM</span>
                        </h1>
                    </div>

                    <div className="px-4 py-3 bg-slate-800/50 rounded-xl mb-6 border border-slate-700/50">
                        <div className="flex items-center gap-3">
                            <img
                                src="https://ui-avatars.com/api/?name=Admin+User&background=10b981&color=fff"
                                alt="Admin"
                                className="w-10 h-10 rounded-full border-2 border-slate-700"
                            />
                            <div>
                                <p className="text-sm font-semibold text-white">Admin User</p>
                                <p className="text-xs text-slate-400">Online</p>
                            </div>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-4">Menu</div>
                    <NavLink to="/" className={navClass}>
                        <MessageSquare className="w-5 h-5" />
                        Inbox
                    </NavLink>
                    <NavLink to="/contacts" className={navClass}>
                        <Users className="w-5 h-5" />
                        Contacts
                    </NavLink>
                    <NavLink to="/broadcast" className={navClass}>
                        <Radio className="w-5 h-5" />
                        Broadcast
                    </NavLink>
                    <NavLink to="/automation" className={navClass}>
                        <Zap className="w-5 h-5" />
                        Automation
                    </NavLink>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-4 mt-6">Resources</div>
                    <NavLink to="/media" className={navClass}>
                        <Image className="w-5 h-5" />
                        Media
                    </NavLink>
                    <NavLink to="/flows" className={navClass}>
                        <Layers className="w-5 h-5" />
                        Flows
                    </NavLink>
                    <NavLink to="/playground" className={navClass}>
                        <Gamepad2 className="w-5 h-5" />
                        Playground
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <NavLink to="#" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
                        <Settings className="w-5 h-5" />
                        Settings
                    </NavLink>
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors mt-1">
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 ml-72 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200/60 px-8 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">{getPageTitle(location.pathname)}</h2>
                        <p className="text-sm text-slate-500">Manage your communication efficienty</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors relative">
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                        </button>
                    </div>
                </header>

                {/* Content Scrollable */}
                <main className="flex-1 overflow-auto bg-slate-50 p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
