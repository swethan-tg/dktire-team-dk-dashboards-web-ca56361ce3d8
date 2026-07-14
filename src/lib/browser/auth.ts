const dummySession = {
  user: {
    name: 'Local Demo User',
    email: 'demo@local.test',
    image: '/avatar.webp',
  },
  expires: '2099-12-31T23:59:59.999Z',
};

export function useSession() {
  return {
    data: dummySession,
    status: 'authenticated',
    update: async () => dummySession,
  };
}

export async function getSession() {
  return dummySession;
}

export async function signIn(..._args: unknown[]) {
  return {
    ok: true,
    error: null,
    status: 200,
    url: '/',
  };
}

export async function signOut(..._args: unknown[]) {
  window.location.assign('/auth/sign-in-1');
}
