"use client";

import Link from "next/link";
import { useAuth } from "../../../contexts/AuthContext";
import Card from "../../../components/Card";

export default function SettingsPage() {
  const { user, hasSubscription, trialDaysRemaining } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[40px] font-light tracking-tight text-[#1d1d1f] mb-2">Settings</h1>
        <p className="text-[17px] text-[#86868b] font-light">Manage your account and preferences.</p>
      </div>

      {/* Profile */}
      <Card title="Profile">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0071e3] to-[#0077ed] text-white grid place-items-center text-xl font-medium">
              {user?.avatarInitials || "U"}
            </div>
            <div>
              <div className="text-[19px] font-medium text-[#1d1d1f]">{user?.name || "User"}</div>
              <div className="text-[15px] text-[#86868b]">{user?.email || "No email"}</div>
            </div>
          </div>
          
          <div className="grid gap-4 pt-4 border-t border-[#f5f5f7]">
            <div>
              <label className="block text-[13px] text-[#86868b] font-light mb-2">Full Name</label>
              <input 
                type="text"
                defaultValue={user?.name || ""}
                className="w-full max-w-md border border-[#d2d2d7] rounded-[12px] px-4 py-3 text-[15px] font-light focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-[13px] text-[#86868b] font-light mb-2">Email</label>
              <input 
                type="email"
                defaultValue={user?.email || ""}
                className="w-full max-w-md border border-[#d2d2d7] rounded-[12px] px-4 py-3 text-[15px] font-light focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] transition-all duration-200"
              />
            </div>
            <button className="btn-primary px-6 py-2.5 text-[15px] font-medium w-fit active:scale-95">
              Save changes
            </button>
          </div>
        </div>
      </Card>

      {/* Subscription */}
      <Card title="Subscription">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[17px] font-medium text-[#1d1d1f]">
              {hasSubscription ? "Pro Plan" : "Free Trial"}
            </div>
            {hasSubscription ? (
              <div className="text-[15px] text-[#34c759]">Active subscription</div>
            ) : trialDaysRemaining !== null ? (
              <div className="text-[15px] text-amber-600">{trialDaysRemaining} days remaining</div>
            ) : (
              <div className="text-[15px] text-red-600">Trial expired</div>
            )}
          </div>
          <Link 
            href="/app/settings/billing"
            className="btn-secondary px-5 py-2 text-[15px] font-light active:scale-95"
          >
            Manage billing
          </Link>
        </div>
      </Card>

      {/* Notifications */}
      <Card title="Notifications">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[15px] text-[#1d1d1f]">Email notifications</div>
              <div className="text-[13px] text-[#86868b]">Receive updates about your properties</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-[#d2d2d7] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#34c759] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-[#f5f5f7]">
            <div>
              <div className="text-[15px] text-[#1d1d1f]">Data update alerts</div>
              <div className="text-[13px] text-[#86868b]">Get notified when zoning data changes</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-[#d2d2d7] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-[#34c759] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>
        </div>
      </Card>

      {/* Password */}
      <Card title="Password">
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] text-[#86868b] font-light mb-2">Current Password</label>
            <input 
              type="password"
              placeholder="••••••••"
              className="w-full max-w-md border border-[#d2d2d7] rounded-[12px] px-4 py-3 text-[15px] font-light focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-[13px] text-[#86868b] font-light mb-2">New Password</label>
            <input 
              type="password"
              placeholder="At least 6 characters"
              className="w-full max-w-md border border-[#d2d2d7] rounded-[12px] px-4 py-3 text-[15px] font-light focus:outline-none focus:ring-2 focus:ring-[#0071e3]/30 focus:border-[#0071e3] transition-all duration-200"
            />
          </div>
          <button className="btn-secondary px-6 py-2.5 text-[15px] font-light w-fit active:scale-95">
            Update password
          </button>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card title="Danger Zone">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[15px] text-[#1d1d1f]">Delete account</div>
            <div className="text-[13px] text-[#86868b]">Permanently delete your account and all data</div>
          </div>
          <button className="px-5 py-2 rounded-full border border-red-300 text-red-600 text-[15px] font-light hover:bg-red-50 active:scale-95 transition-all">
            Delete account
          </button>
        </div>
      </Card>
    </div>
  );
}



