import PersonalInfo from '@/app/shared/logistics/customer-profile/personal-info';
import RecentPayments from '@/app/shared/logistics/customer-profile/recent-payments';
import RecentShipments from '@/app/shared/logistics/customer-profile/recent-shipments';
import UserInfo from '@/app/shared/logistics/customer-profile/user-info';

export default function CustomerProfile() {
  return (
    <div className="@container">
      <UserInfo className="mb-8" />
      <div className="grid grid-cols-1 gap-6 @5xl:grid-cols-2">
        <PersonalInfo />
        <RecentPayments />
      </div>
      <div className="mt-6">
        <RecentShipments />
      </div>
    </div>
  );
}
