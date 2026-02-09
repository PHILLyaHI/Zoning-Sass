// Authentication utilities
// In production, replace with Clerk, Auth0, or NextAuth

export type User = {
  id: string;
  email: string;
  name: string;
  avatarInitials: string;
  subscription: SubscriptionStatus;
  createdAt: Date;
};

export type SubscriptionStatus = {
  plan: "free_trial" | "pro" | "cancelled";
  status: "active" | "trialing" | "past_due" | "cancelled";
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
};

// Session storage key
const SESSION_KEY = "zoning_session";

// Mock user for development
const mockUser: User = {
  id: "user_demo_123",
  email: "demo@example.com",
  name: "Demo User",
  avatarInitials: "DU",
  subscription: {
    plan: "pro",
    status: "active",
    trialEndsAt: null,
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  },
  createdAt: new Date(),
};

// Check if user is logged in
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  const session = localStorage.getItem(SESSION_KEY);
  return session !== null;
}

// Get current user
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  const session = localStorage.getItem(SESSION_KEY);
  if (!session) return null;
  
  try {
    const parsed = JSON.parse(session);
    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
      subscription: {
        ...parsed.subscription,
        trialEndsAt: parsed.subscription.trialEndsAt ? new Date(parsed.subscription.trialEndsAt) : null,
        currentPeriodEnd: parsed.subscription.currentPeriodEnd ? new Date(parsed.subscription.currentPeriodEnd) : null,
      },
    };
  } catch {
    return null;
  }
}

// Login user
export function loginUser(email: string, password: string): { success: boolean; user?: User; error?: string } {
  // In production, this would validate against your auth provider
  // For now, accept any email/password and create a session
  
  if (!email || !email.includes("@")) {
    return { success: false, error: "Please enter a valid email address" };
  }
  
  if (!password || password.length < 1) {
    return { success: false, error: "Please enter your password" };
  }
  
  // Create user from email
  const nameParts = email.split("@")[0].split(".");
  const name = nameParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
  const initials = nameParts.slice(0, 2).map(p => p.charAt(0).toUpperCase()).join("");
  
  const user: User = {
    id: `user_${Date.now()}`,
    email,
    name: name || "User",
    avatarInitials: initials || "U",
    subscription: {
      plan: "pro",
      status: "active",
      trialEndsAt: null,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    createdAt: new Date(),
  };
  
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return { success: true, user };
}

// Sign up user
export function signupUser(email: string, password: string): { success: boolean; user?: User; error?: string } {
  // In production, this would create account with your auth provider
  
  if (!email || !email.includes("@")) {
    return { success: false, error: "Please enter a valid email address" };
  }
  
  if (!password || password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters" };
  }
  
  // Create user from email
  const nameParts = email.split("@")[0].split(".");
  const name = nameParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
  const initials = nameParts.slice(0, 2).map(p => p.charAt(0).toUpperCase()).join("");
  
  const user: User = {
    id: `user_${Date.now()}`,
    email,
    name: name || "User",
    avatarInitials: initials || "U",
    subscription: {
      plan: "free_trial",
      status: "trialing",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 day trial
      currentPeriodEnd: null,
    },
    createdAt: new Date(),
  };
  
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return { success: true, user };
}

// Logout user
export function logoutUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

// Upgrade to paid plan
export function upgradeToPro(): { success: boolean; user?: User } {
  const user = getCurrentUser();
  if (!user) return { success: false };
  
  const updatedUser: User = {
    ...user,
    subscription: {
      plan: "pro",
      status: "active",
      trialEndsAt: null,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  };
  
  localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
  return { success: true, user: updatedUser };
}

// Check if subscription is active
export function hasActiveSubscription(): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  
  const { subscription } = user;
  
  if (subscription.status === "active") return true;
  
  if (subscription.status === "trialing" && subscription.trialEndsAt) {
    return new Date() < subscription.trialEndsAt;
  }
  
  return false;
}

// Get days remaining in trial
export function getTrialDaysRemaining(): number | null {
  const user = getCurrentUser();
  if (!user) return null;
  
  if (user.subscription.status !== "trialing" || !user.subscription.trialEndsAt) {
    return null;
  }
  
  const msRemaining = user.subscription.trialEndsAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
}



