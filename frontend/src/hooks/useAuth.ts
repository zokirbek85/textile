"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi, usersApi } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

export function useLogin() {
  const router = useRouter();
  const { setTokens } = useAuthStore();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: ({ data }) => {
      setTokens(data.access, data.refresh, data.user);
      router.push("/dashboard");
      toast.success(`Welcome back, ${data.user.full_name}!`);
    },
    onError: () => {
      toast.error("Invalid email or password.");
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const { refreshToken, clearAuth } = useAuthStore();

  return useMutation({
    mutationFn: () => authApi.logout(refreshToken ?? ""),
    onSettled: () => {
      clearAuth();
      router.push("/login");
    },
  });
}

export function useCurrentUser() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["me"],
    queryFn: () => usersApi.me().then((r) => r.data),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
}
