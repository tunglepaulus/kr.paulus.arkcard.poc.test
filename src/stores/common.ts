import { create } from 'zustand';

interface CommonState {
  invitationToken: string | null;
}

interface CommonDispatch {
  reset: () => void;
  setInvitationToken: (invitationToken: string | null) => void;
}

const INITIAL_STATE: CommonState = {
  invitationToken: null,
};

const useCommonStore = create<CommonState & CommonDispatch>((set) => ({
  ...INITIAL_STATE,
  setInvitationToken: (invitationToken) => set({ invitationToken }),
  reset: () => set(INITIAL_STATE),
}));

export default useCommonStore;
