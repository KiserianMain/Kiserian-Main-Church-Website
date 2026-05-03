import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Card, Button, Avatar, Chip } from 'react-native-paper';
import { Icon } from 'react-native-vector-icons/MaterialIcons';
import { authAPI, paymentsAPI, announcementsAPI } from '../services/api';

const DashboardScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalPayments: 0,
    upcomingEvents: 0,
    recentAnnouncements: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load user data
      const userData = await authAPI.loadUser();
      setUser(userData.user);

      // Load dashboard stats (mock data for now)
      setStats({
        totalMembers: 245,
        totalPayments: 125000,
        upcomingEvents: 5,
        recentAnnouncements: 12,
      });

      // Load recent activities
      setRecentActivities([
        {
          id: 1,
          type: 'payment',
          title: 'New payment received',
          description: 'John Doe paid KES 5,000',
          time: '2 hours ago',
          icon: 'attach-money',
          color: '#22c55e',
        },
        {
          id: 2,
          type: 'announcement',
          title: 'New announcement posted',
          description: 'Sabbath School updates',
          time: '4 hours ago',
          icon: 'campaign',
          color: '#3b82f6',
        },
        {
          id: 3,
          type: 'event',
          title: 'New event created',
          description: 'Youth Fellowship Meeting',
          time: '6 hours ago',
          icon: 'event',
          color: '#8b5cf6',
        },
        {
          id: 4,
          type: 'member',
          title: 'New member registered',
          description: 'Jane Smith joined',
          time: '1 day ago',
          icon: 'people',
          color: '#f59e0b',
        },
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statContent}>
        <View style={styles.statHeader}>
          <Icon name={icon} size={24} color={color} />
          <Text style={styles.statValue}>{value}</Text>
        </View>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statSubtitle}>{subtitle}</Text>
      </View>
    </Card>
  );

  const ActivityItem = ({ activity }) => (
    <View style={styles.activityItem}>
      <View style={[styles.activityIcon, { backgroundColor: `${activity.color}20` }]}>
        <Icon name={activity.icon} size={16} color={activity.color} />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{activity.title}</Text>
        <Text style={styles.activityDescription}>{activity.description}</Text>
        <Text style={styles.activityTime}>{activity.time}</Text>
      </View>
    </View>
  );

  const QuickAction = ({ title, icon, color, onPress }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
        <Icon name={icon} size={24} color="white" />
      </View>
      <Text style={styles.quickActionTitle}>{title}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>
            Welcome back, {user?.first_name || 'User'}!
          </Text>
          <Text style={styles.subtitleText}>
            Here's what's happening at SDA Church Kiserian Main today.
          </Text>
        </View>
        <Avatar.Text 
          size={50} 
          label={`${user?.first_name?.[0] || 'U'}${user?.last_name?.[0] || ''}`}
          style={styles.avatar}
        />
      </View>

      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Total Members"
          value="245"
          icon="people"
          color="#3b82f6"
          subtitle="12% from last month"
        />
        <StatCard
          title="Total Payments"
          value="KES 125,000"
          icon="attach-money"
          color="#22c55e"
          subtitle="8% from last month"
        />
        <StatCard
          title="Upcoming Events"
          value="5"
          icon="event"
          color="#8b5cf6"
          subtitle="Next event in 2 days"
        />
        <StatCard
          title="Announcements"
          value="12"
          icon="campaign"
          color="#f59e0b"
          subtitle="2 urgent"
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsContainer}>
          <QuickAction
            title="Make Payment"
            icon="attach-money"
            color="#22c55e"
            onPress={() => navigation.navigate('Payments')}
          />
          <QuickAction
            title="Announcements"
            icon="campaign"
            color="#3b82f6"
            onPress={() => navigation.navigate('Announcements')}
          />
          <QuickAction
            title="Events"
            icon="event"
            color="#8b5cf6"
            onPress={() => navigation.navigate('Events')}
          />
          <QuickAction
            title="Members"
            icon="people"
            color="#f59e0b"
            onPress={() => navigation.navigate('Members')}
          />
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Card style={styles.activityCard}>
          <FlatList
            data={recentActivities}
            renderItem={({ item }) => <ActivityItem activity={item} />}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefdfb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitleText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  avatar: {
    backgroundColor: '#3b82f6',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    marginBottom: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statContent: {
    flex: 1,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#059669',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 15,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    width: '23%',
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
});

export default DashboardScreen;
