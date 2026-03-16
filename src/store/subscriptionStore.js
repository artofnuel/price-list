import { create } from 'zustand';

export const useSubscriptionStore = create((set) => ({
  plan: 'free',
  status: null,
  isPremium: false,
  renewalDate: null,
  provider: null,
  loading: true,

  setSubscription: (data) => {
    if (!data) {
      set({
        plan: 'free',
        status: null,
        isPremium: false,
        renewalDate: null,
        provider: null,
        loading: false,
      });
      return;
    }

    set({
      plan: data.plan_type || 'free',
      status: data.status,
      isPremium: data.plan_type === 'premium' && data.status === 'active',
      renewalDate: data.current_period_end,
      provider: data.provider,
      loading: false,
    });
  },

  reset: () => set({
    plan: 'free',
    status: null,
    isPremium: false,
    renewalDate: null,
    provider: null,
    loading: false,
  })
}));
