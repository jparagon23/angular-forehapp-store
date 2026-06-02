export interface RecentUser {
  id: number;
  name: string;
  lastname: string;
  email: string;
  phone: string;
  creationDate: string;
}

export interface RegistrationTrend {
  date: string;
  count: number;
}

export interface UserStats {
  totalUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  usersWhoOrdered: number;
  conversionRate: number;
  usersWithPhone: number;
  activeUsers: number;
  recentUsers: RecentUser[];
  registrationTrend: RegistrationTrend[];
}
