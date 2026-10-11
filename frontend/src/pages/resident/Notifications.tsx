import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import clsx from 'clsx';
import { listMyNotifications, markRead, markAllRead } from '@/services/notifications.service';
import PageHeader from '@/components/PageHeader';
import { formatDateTime } from '@/utils/format';

export default function Notifications() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['notifications', 'me'], queryFn: listMyNotifications });

  const markOne = useMutation({
    mutationFn: (id: string) => markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', 'me'] }),
  });

  const markAll = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', 'me'] }),
  });

  const unreadCount = data?.filter((n) => !n.read).length ?? 0;

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={unreadCount ? `${unreadCount} unread` : 'You are all caught up'}
        actions={
          unreadCount > 0 ? (
            <button className="btn-secondary" onClick={() => markAll.mutate()}>
              <CheckCheck size={16} /> Mark all read
            </button>
          ) : undefined
        }
      />

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : !data?.length ? (
        <div className="card p-8 text-center text-sm text-gray-400">
          <Bell className="mx-auto mb-2 text-gray-300" size={28} />
          No notifications yet.
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {data.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.read && markOne.mutate(n.id)}
              className={clsx('flex items-start gap-3 px-5 py-3.5', !n.read && 'cursor-pointer bg-brand-50/40')}
            >
              <div className={clsx('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-gray-200' : 'bg-brand-500')} />
              <div className="flex-1">
                <p className={clsx('text-sm', n.read ? 'text-gray-600' : 'font-medium text-gray-900')}>{n.message}</p>
                <p className="mt-0.5 text-xs text-gray-400">{formatDateTime(n.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
