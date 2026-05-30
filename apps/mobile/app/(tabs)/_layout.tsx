import { Tabs } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { ColorValue } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { colors } from '../../src/theme/colors';
import { t } from '../../src/i18n';
import { PageLoading } from '../../src/components/PageState';

function TabIcon({
  name,
  color,
}: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: ColorValue;
}) {
  return <FontAwesome size={22} name={name} color={color as string} />;
}

export default function TabLayout() {
  const { user, loading } = useAuth();

  if (loading) return <PageLoading />;

  const isSeller = user?.role === 'seller';
  const isAdmin = user?.role === 'admin';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.brand600,
        tabBarInactiveTintColor: colors.muted,
        headerStyle: { backgroundColor: colors.brand50 },
        headerTintColor: colors.brand900,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ color }) => <TabIcon name="search" color={color} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: t('favorites'),
          tabBarIcon: ({ color }) => <TabIcon name="heart" color={color} />,
          href: user ? '/favorites' : null,
        }}
      />
      <Tabs.Screen
        name="seller"
        options={{
          title: t('seller'),
          tabBarIcon: ({ color }) => <TabIcon name="car" color={color} />,
          href: isSeller ? '/seller' : null,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: t('admin'),
          tabBarIcon: ({ color }) => <TabIcon name="shield" color={color} />,
          href: isAdmin ? '/admin' : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ color }) => <TabIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
