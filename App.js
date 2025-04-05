import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet, Alert,
  TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView,
  Keyboard, StatusBar, Dimensions, Modal, Image
} from 'react-native';
import Animated, {
  FadeIn, FadeOut, Layout, SlideInRight, SlideOutLeft,
  useAnimatedStyle, useSharedValue, withSpring, withTiming, Easing
} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Picker } from '@react-native-picker/picker';
import * as Notifications from 'expo-notifications';

// Navigation setup
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const { width } = Dimensions.get('window');

// App Context
const AppContext = React.createContext();

// Themes and Task Database (unchanged)
const themes = {
  dark: { primary: '#111827', secondary: '#374151', accent: '#10b981', background: '#1F2937', card: '#2D3748', text: '#F9FAFB', subtext: '#9CA3AF', border: '#4B5563', error: '#EF4444', success: '#10B981', warning: '#F59E0B', button: '#10b981', buttonText: '#F9FAFB', inputBackground: '#374151' },
  light: { primary: '#111827', secondary: '#4B5563', accent: '#10b981', background: '#F9FAFB', card: '#FFFFFF', text: '#1F2937', subtext: '#6B7280', border: '#E5E7EB', error: '#EF4444', success: '#10B981', warning: '#F59E0B', button: '#10b981', buttonText: '#FFFFFF', inputBackground: '#F3F4F6' },
  grayscale: { primary: '#1F1F1F', secondary: '#555555', accent: '#757575', background: '#F5F5F5', card: '#FFFFFF', text: '#212121', subtext: '#757575', border: '#E0E0E0', error: '#616161', success: '#9E9E9E', warning: '#757575', button: '#424242', buttonText: '#FFFFFF', inputBackground: '#EEEEEE' },
  midnight: { primary: '#1a1a2e', secondary: '#16213e', accent: '#0f3460', background: '#0a0a1a', card: '#1a1a2e', text: '#e94560', subtext: '#b0b0cc', border: '#16213e', error: '#e94560', success: '#3a86ff', warning: '#fca311', button: '#e94560', buttonText: '#ffffff', inputBackground: '#16213e' },
};

const taskDatabase = {
  development: { keywords: ['app', 'program', 'code', 'build', 'device', 'software', 'hardware', 'develop', 'tech'], columns: [{ name: 'Description', prompt: 'What does it do?', type: 'text' }, { name: 'Deadline', prompt: 'When do you want it done?', type: 'date' }, { name: 'Priority', prompt: 'High, Medium, or Low?', type: 'select', options: ['High', 'Medium', 'Low'] }, { name: 'Tools/Tech', prompt: 'What tools or languages?', type: 'text' }, { name: 'Steps', prompt: 'List main steps or milestones', type: 'text', multiline: true, bullet: true }, { name: 'Resources', prompt: 'What do you need (e.g., tutorials)?', type: 'text' }], icon: 'code-slash' },
  groceries: { keywords: ['grocery', 'shop', 'buy', 'store', 'food', 'market'], columns: [{ name: 'Description', prompt: 'What are you shopping for?', type: 'text' }, { name: 'Deadline', prompt: 'By when?', type: 'date' }, { name: 'Priority', prompt: 'High, Medium, or Low?', type: 'select', options: ['High', 'Medium', 'Low'] }, { name: 'Items', prompt: 'List items to buy', type: 'text', multiline: true, bullet: true }, { name: 'Budget', prompt: 'How much to spend?', type: 'text' }], icon: 'cart' },
  chores: { keywords: ['clean', 'chore', 'tidy', 'wash', 'organize', 'dust', 'vacuum'], columns: [{ name: 'Description', prompt: 'What needs doing?', type: 'text' }, { name: 'Deadline', prompt: 'By when?', type: 'date' }, { name: 'Priority', prompt: 'High, Medium, or Low?', type: 'select', options: ['High', 'Medium', 'Low'] }, { name: 'Tasks', prompt: 'List specific tasks', type: 'text', multiline: true, bullet: true }, { name: 'Duration', prompt: 'How long will it take?', type: 'text' }], icon: 'home' },
  daily: { keywords: ['daily', 'routine', 'exercise', 'read', 'meditate', 'habit'], columns: [{ name: 'Description', prompt: 'Whats the task?', type: 'text' }, { name: 'Deadline', prompt: 'By when today?', type: 'date' }, { name: 'Priority', prompt: 'High, Medium, or Low?', type: 'select', options: ['High', 'Medium', 'Low'] }, { name: 'Time', prompt: 'When will you do it?', type: 'time' }, { name: 'Days', prompt: 'Which days?', type: 'select', options: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], multiple: true }, { name: 'Notes', prompt: 'Any extra details?', type: 'text' }], icon: 'calendar' },
  generic: { columns: [{ name: 'Description', prompt: 'What is it about?', type: 'text' }, { name: 'Deadline', prompt: 'When is it due?', type: 'date' }, { name: 'Priority', prompt: 'High, Medium, or Low?', type: 'select', options: ['High', 'Medium', 'Low'] }, { name: 'Notes', prompt: 'Additional details', type: 'text', multiline: true }], icon: 'document-text' },
};

// Notification Setup (unchanged)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Button Component (unchanged)
const Button = ({ title, onPress, style, textStyle, icon, isPrimary = true }) => {
  const { theme } = React.useContext(AppContext);
  return (
    <TouchableOpacity onPress={onPress} style={[styles.button, { backgroundColor: isPrimary ? theme.button : 'transparent', borderWidth: isPrimary ? 0 : 1, borderColor: theme.border }, style]} activeOpacity={0.7}>
      {icon && <Ionicons name={icon} size={18} color={isPrimary ? theme.buttonText : theme.text} style={{ marginRight: 8 }} />}
      <Text style={[styles.buttonText, { color: isPrimary ? theme.buttonText : theme.text }, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

// Loading Screen (unchanged)
const LoadingScreen = () => {
  const { theme } = React.useContext(AppContext);
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withTiming(360, { duration: 1000, easing: Easing.linear }, (finished) => {
      if (finished) { rotation.value = 0; rotation.value = withTiming(360, { duration: 1000, easing: Easing.linear }); }
    });
  }, [rotation]);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));
  return (
    <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
      <Animated.View style={animatedStyle}><Ionicons name="refresh" size={48} color={theme.accent} /></Animated.View>
      <Text style={[styles.loadingText, { color: theme.text }]}>Loading...</Text>
    </View>
  );
};

// Login Screen (unchanged)
function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, theme } = React.useContext(AppContext);
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.authContainer, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.primary === '#111827' ? 'dark-content' : 'light-content'} />
      <LinearGradient colors={['transparent', theme.accent + '20']} style={styles.authGradient} />
      <Animated.View entering={FadeIn.duration(800)} style={styles.logoContainer}>
        <Text style={[styles.appTitle, { color: theme.text }]}>DontTell.Do</Text>
        <Text style={[styles.appSlogan, { color: theme.subtext }]}>Keep it secret, get it done</Text>
      </Animated.View>
      <Animated.View entering={FadeIn.delay(200).duration(800)} style={styles.formContainer}>
        <Text style={[styles.formTitle, { color: theme.text }]}>Welcome Back</Text>
        <View style={[styles.inputContainer, { backgroundColor: theme.inputBackground }]}>
          <Ionicons name="mail-outline" size={20} color={theme.subtext} style={styles.inputIcon} />
          <TextInput style={[styles.authInput, { color: theme.text }]} placeholder="Email" placeholderTextColor={theme.subtext} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        </View>
        <View style={[styles.inputContainer, { backgroundColor: theme.inputBackground }]}>
          <Ionicons name="lock-closed-outline" size={20} color={theme.subtext} style={styles.inputIcon} />
          <TextInput style={[styles.authInput, { color: theme.text }]} placeholder="Password" placeholderTextColor={theme.subtext} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.passwordToggle}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={theme.subtext} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.forgotPasswordLink}><Text style={[styles.forgotPasswordText, { color: theme.accent }]}>Forgot Password?</Text></TouchableOpacity>
        <Button title="Sign In" icon="log-in" onPress={() => login(email, password)} style={styles.signInButton} />
        <View style={styles.divider}><View style={[styles.dividerLine, { backgroundColor: theme.border }]} /><Text style={[styles.dividerText, { color: theme.subtext }]}>OR</Text><View style={[styles.dividerLine, { backgroundColor: theme.border }]} /></View>
        <Button title="Create Account" onPress={() => navigation.navigate('Register')} isPrimary={false} style={styles.createAccountButton} />
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

// Register Screen (unchanged)
const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, theme } = React.useContext(AppContext);
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.authContainer, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.primary === '#111827' ? 'dark-content' : 'light-content'} />
      <LinearGradient colors={['transparent', theme.accent + '20']} style={styles.authGradient} />
      <ScrollView showsVerticalScrollIndicator={false} style={styles.registerScrollView}>
        <Animated.View entering={FadeIn.duration(800)} style={styles.logoContainer}>
          <Text style={[styles.appTitle, { color: theme.text }]}>DontTell.Do</Text>
          <Text style={[styles.appSlogan, { color: theme.subtext }]}>Keep it secret, get it done</Text>
        </Animated.View>
        <Animated.View entering={FadeIn.delay(200).duration(800)} style={styles.formContainer}>
          <Text style={[styles.formTitle, { color: theme.text }]}>Create Account</Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.inputBackground }]}>
            <Ionicons name="person-outline" size={20} color={theme.subtext} style={styles.inputIcon} />
            <TextInput style={[styles.authInput, { color: theme.text }]} placeholder="Full Name" placeholderTextColor={theme.subtext} value={name} onChangeText={setName} />
          </View>
          <View style={[styles.inputContainer, { backgroundColor: theme.inputBackground }]}>
            <Ionicons name="mail-outline" size={20} color={theme.subtext} style={styles.inputIcon} />
            <TextInput style={[styles.authInput, { color: theme.text }]} placeholder="Email" placeholderTextColor={theme.subtext} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>
          <View style={[styles.inputContainer, { backgroundColor: theme.inputBackground }]}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.subtext} style={styles.inputIcon} />
            <TextInput style={[styles.authInput, { color: theme.text }]} placeholder="Password" placeholderTextColor={theme.subtext} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.passwordToggle}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={theme.subtext} />
            </TouchableOpacity>
          </View>
          <View style={[styles.inputContainer, { backgroundColor: theme.inputBackground }]}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.subtext} style={styles.inputIcon} />
            <TextInput style={[styles.authInput, { color: theme.text }]} placeholder="Confirm Password" placeholderTextColor={theme.subtext} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} />
          </View>
          <Button title="Create Account" icon="person-add" onPress={() => register(name, email, password, confirmPassword)} style={styles.signInButton} />
          <View style={styles.loginLinkContainer}>
            <Text style={[styles.loginLinkText, { color: theme.subtext }]}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.loginLink, { color: theme.accent }]}> Sign In</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Home Screen (updated to use navigation)
const HomeScreen = ({ navigation }) => {
  const [task, setTask] = useState('');
  const { user, theme, tasks, addTask: contextAddTask, setShowPremiumModal } = React.useContext(AppContext);
  const taskInputRef = useRef(null);
  const scale = useSharedValue(1);

  const addTask = () => {
    if (task.trim() === '') return;
    contextAddTask(task);
    setTask('');
    scale.value = withSpring(1.1, { damping: 10, stiffness: 100 }, () => {
      scale.value = withSpring(1, { damping: 10, stiffness: 100 });
    });
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const highPriorityCount = tasks.filter(t => t.details.Priority === 'High').length;
  const dueTodayCount = tasks.filter(t => {
    if (!t.details.Deadline) return false;
    const today = new Date();
    const deadline = new Date(t.details.Deadline);
    return deadline.getDate() === today.getDate() && deadline.getMonth() === today.getMonth() && deadline.getFullYear() === today.getFullYear();
  }).length;

  return (
    <View style={[styles.homeContainer, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.primary === '#111827' ? 'dark-content' : 'light-content'} />
      <Animated.View entering={FadeIn.duration(800)} style={styles.homeHeader}>
        <View>
          <Text style={[styles.welcomeText, { color: theme.text }]}>Hello, {user?.name || 'there'}</Text>
          <Text style={[styles.dateText, { color: theme.subtext }]}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        </View>
        <TouchableOpacity style={[styles.avatarContainer, { backgroundColor: theme.card }]} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="person" size={20} color={theme.accent} />
        </TouchableOpacity>
      </Animated.View>
      <Animated.View entering={FadeIn.delay(200).duration(800)} style={[styles.statsContainer, { backgroundColor: theme.card }]}>
        <View style={styles.statItem}><Text style={[styles.statValue, { color: theme.text }]}>{tasks.length}</Text><Text style={[styles.statLabel, { color: theme.subtext }]}>Total Tasks</Text></View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}><Text style={[styles.statValue, { color: theme.text }]}>{highPriorityCount}</Text><Text style={[styles.statLabel, { color: theme.subtext }]}>High Priority</Text></View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}><Text style={[styles.statValue, { color: theme.text }]}>{dueTodayCount}</Text><Text style={[styles.statLabel, { color: theme.subtext }]}>Due Today</Text></View>
      </Animated.View>
      <Animated.View entering={FadeIn.delay(300).duration(800)} style={[styles.quickAddContainer, { backgroundColor: theme.card }]}>
        <Text style={[styles.quickAddTitle, { color: theme.text }]}>Quick Add Task</Text>
        <View style={styles.quickAddInputRow}>
          <View style={[styles.quickAddInputContainer, { backgroundColor: theme.inputBackground }]}>
            <TextInput ref={taskInputRef} style={[styles.quickAddInput, { color: theme.text }]} placeholder="Add a new task..." placeholderTextColor={theme.subtext} value={task} onChangeText={setTask} onSubmitEditing={addTask} />
          </View>
          <Animated.View style={animatedButtonStyle}>
            <TouchableOpacity style={[styles.quickAddButton, { backgroundColor: theme.accent }]} onPress={addTask} activeOpacity={0.8}>
              <Ionicons name="add" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        </View>
        <Text style={[styles.quickAddTip, { color: theme.subtext }]}>Tip: Add keywords like "app" or "grocery" for auto-categorization</Text>
      </Animated.View>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>My Task List</Text>
      {tasks.length > 0 ? (
        <TouchableOpacity style={[styles.viewAllButton, { backgroundColor: theme.card }]} onPress={() => navigation.navigate('Tasks')} activeOpacity={0.7}>
          <Text style={[styles.viewAllText, { color: theme.text }]}>View All Tasks</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.text} />
        </TouchableOpacity>
      ) : (
        <Animated.View entering={FadeIn.delay(400).duration(800)} style={[styles.emptyStateContainer, { backgroundColor: theme.card }]}>
          <Ionicons name="list" size={40} color={theme.subtext} />
          <Text style={[styles.emptyStateText, { color: theme.text }]}>No tasks yet</Text>
          <Text style={[styles.emptyStateSubtext, { color: theme.subtext }]}>Create your first task to get started</Text>
        </Animated.View>
      )}
      <View style={styles.premiumPromotionContainer}>
        <LinearGradient colors={[theme.accent + '50', theme.accent + '20']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.premiumPromotion, { borderColor: theme.accent + '50' }]}>
          <View style={styles.premiumPromotionContent}>
            <Ionicons name="flash" size={24} color={theme.accent} />
            <View style={styles.premiumPromotionTextContainer}>
              <Text style={[styles.premiumPromotionTitle, { color: theme.text }]}>Upgrade to Pro</Text>
              <Text style={[styles.premiumPromotionSubtitle, { color: theme.subtext }]}>Get AI-powered task suggestions and insights</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.premiumPromotionButton, { backgroundColor: theme.accent }]} onPress={() => setShowPremiumModal(true)}>
            <Text style={styles.premiumPromotionButtonText}>Upgrade</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
};

// Task Item (updated to use navigation)
const TaskItem = ({ item, index, theme, deleteTask, navigation }) => {
  const getDaysUntilDeadline = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    const due = new Date(deadline);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: `Overdue by ${-diffDays} ${diffDays === -1 ? 'day' : 'days'}`, color: theme.error };
    else if (diffDays === 0) return { text: 'Due today', color: theme.warning };
    else if (diffDays === 1) return { text: 'Due tomorrow', color: theme.warning };
    else if (diffDays <= 7) return { text: `${diffDays} days left`, color: theme.accent };
    else return { text: `${diffDays} days left`, color: theme.subtext };
  };

  const deadline = getDaysUntilDeadline(item.details.Deadline);
  const taskIcon = taskDatabase[item.type]?.icon || 'document-text';
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return theme.error;
      case 'Medium': return theme.warning;
      case 'Low': return theme.success;
      default: return theme.subtext;
    }
  };

  return (
    <Animated.View entering={FadeIn.delay(index * 100).duration(400)} layout={Layout.springify()} style={[styles.taskCard, { backgroundColor: theme.card }]}>
      <TouchableOpacity style={styles.taskCardContent} onPress={() => navigation.navigate('TaskDetail', { task: item })} activeOpacity={0.7}>
        <View style={[styles.taskIconContainer, { backgroundColor: theme.inputBackground }]}>
          <Ionicons name={taskIcon} size={20} color={theme.accent} />
        </View>
        <View style={styles.taskInfoContainer}>
          <View style={styles.taskHeaderRow}>
            <Text style={[styles.taskTitle, { color: theme.text }]} numberOfLines={1}>{item.text}</Text>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.details.Priority) + '20' }]}>
              <Text style={[styles.priorityText, { color: getPriorityColor(item.details.Priority) }]}>{item.details.Priority || 'No Priority'}</Text>
            </View>
          </View>
          <View style={styles.taskDetailsRow}>
            <Text style={[styles.taskType, { color: theme.subtext }]}>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</Text>
            {deadline && <Text style={[styles.deadlineText, { color: deadline.color }]}>{deadline.text}</Text>}
          </View>
        </View>
        <TouchableOpacity style={styles.deleteTaskButton} onPress={() => deleteTask(item.id)}>
          <Ionicons name="trash-outline" size={18} color={theme.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Tasks Screen (updated to pass navigation)
const TasksScreen = ({ navigation }) => {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('priority');
  const { theme, tasks, deleteTask } = React.useContext(AppContext);

  const filteredTasks = tasks.filter(task => categoryFilter === 'all' || task.type === categoryFilter);
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'priority') {
      const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3, '': 4 };
      return priorityOrder[a.details.Priority || ''] - priorityOrder[b.details.Priority || ''];
    } else if (sortBy === 'deadline') {
      if (!a.details.Deadline && !b.details.Deadline) return 0;
      if (!a.details.Deadline) return 1;
      if (!b.details.Deadline) return -1;
      return new Date(a.details.Deadline) - new Date(b.details.Deadline);
    }
    return 0;
  });

  return (
    <View style={[styles.tasksContainer, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.primary === '#111827' ? 'dark-content' : 'light-content'} />
      <Animated.View entering={FadeIn.duration(400)} style={styles.taskFiltersContainer}>
        <View style={styles.categoryPickerContainer}>
          <Picker selectedValue={categoryFilter} onValueChange={(itemValue) => setCategoryFilter(itemValue)} style={[styles.categoryPicker, { backgroundColor: theme.card, color: theme.text }]} itemStyle={{ fontFamily: 'Inter_400Regular', fontSize: 16 }}>
            <Picker.Item label="All" value="all" />
            {Object.keys(taskDatabase).map(category => (
              <Picker.Item key={category} label={category.charAt(0).toUpperCase() + category.slice(1)} value={category} />
            ))}
          </Picker>
        </View>
        <View style={styles.sortByContainer}>
          <TouchableOpacity style={[styles.sortButton, { borderColor: theme.border }]} onPress={() => setSortBy(sortBy === 'priority' ? 'deadline' : 'priority')}>
            <Text style={[styles.sortButtonText, { color: theme.subtext }]}>Sort by: {sortBy === 'priority' ? 'Priority' : 'Deadline'}</Text>
            <Ionicons name="swap-vertical" size={18} color={theme.subtext} />
          </TouchableOpacity>
        </View>
      </Animated.View>
      {sortedTasks.length > 0 ? (
        <FlatList
          data={sortedTasks}
          renderItem={({ item, index }) => <TaskItem item={item} index={index} theme={theme} deleteTask={deleteTask} navigation={navigation} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.tasksList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <Animated.View entering={FadeIn.delay(300).duration(800)} style={styles.emptyTasksContainer}>
          <Ionicons name="document-text-outline" size={60} color={theme.subtext} />
          <Text style={[styles.emptyTasksTitle, { color: theme.text }]}>No tasks found</Text>
          <Text style={[styles.emptyTasksSubtitle, { color: theme.subtext }]}>
            {categoryFilter === 'all' ? 'Create a new task to get started' : `No ${categoryFilter} tasks found. Try a different category or create a new task.`}
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

// Task Detail Screen (fixed to prevent animation reset on typing)
const TaskDetailScreen = ({ route, navigation }) => {
  const { theme, updateTaskDetail } = React.useContext(AppContext);
  const selectedTask = route.params?.task; // Get task from navigation params
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [tempTime, setTempTime] = useState(new Date());
  const [inputValues, setInputValues] = useState(selectedTask ? { ...selectedTask.details } : {});

  const columns = React.useMemo(() => (selectedTask ? taskDatabase[selectedTask.type].columns : []), [selectedTask]);
  const taskIcon = selectedTask ? taskDatabase[selectedTask.type]?.icon || 'document-text' : null;

  // Effect to sync inputValues with selectedTask.details on mount or task change
  React.useEffect(() => {
    if (selectedTask) {
      setInputValues({ ...selectedTask.details });
    }
  }, [selectedTask]);

  const scheduleNotification = async (time, days, taskText, taskId) => {
    await Notifications.cancelScheduledNotificationAsync(taskId);
    const triggerTime = new Date(time);
    const dayMap = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 0 };
    const now = new Date();
    days.forEach(async (day) => {
      const notificationDate = new Date(triggerTime);
      const currentDay = now.getDay();
      const targetDay = dayMap[day];
      let daysUntil = (targetDay + 7 - currentDay) % 7;
      if (daysUntil === 0 && now > triggerTime) daysUntil = 7;
      notificationDate.setDate(now.getDate() + daysUntil);
      notificationDate.setHours(triggerTime.getHours());
      notificationDate.setMinutes(triggerTime.getMinutes());
      notificationDate.setSeconds(0);
      notificationDate.setMilliseconds(0);
      await Notifications.scheduleNotificationAsync({
        content: { title: "Task Reminder", body: `Time to work on: ${taskText}`, data: { taskId } },
        trigger: { date: notificationDate, repeats: true, channelId: 'task-reminders' },
        identifier: `${taskId}-${day}`,
      });
    });
  };

  const handleInputChange = (column, value) => {
    setInputValues((prev) => ({ ...prev, [column]: value }));
    updateTaskDetail(selectedTask.id, column, value);
  };

  if (!selectedTask) return <View style={[styles.container, { backgroundColor: theme.background }]} />;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.detailContainer, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.primary === '#111827' ? 'dark-content' : 'light-content'} />
      <Animated.View entering={FadeIn.duration(400)} style={[styles.detailHeader, { backgroundColor: theme.card }]}>
        <View style={[styles.detailIconContainer, { backgroundColor: theme.background }]}>
          <Ionicons name={taskIcon} size={28} color={theme.accent} />
        </View>
        <View style={styles.detailTitleContainer}>
          <Text style={[styles.detailTitleText, { color: theme.text }]}>{selectedTask.text}</Text>
          <Text style={[styles.detailTypeText, { color: theme.subtext }]}>{selectedTask.type.charAt(0).toUpperCase() + selectedTask.type.slice(1)}</Text>
        </View>
        <TouchableOpacity style={styles.closeDetailButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={theme.subtext} />
        </TouchableOpacity>
      </Animated.View>
      <ScrollView style={styles.detailScrollView} contentContainerStyle={styles.detailScrollContent} showsVerticalScrollIndicator={false}>
        {columns.map((col, index) => (
          <View key={col.name} style={[styles.detailField, { backgroundColor: theme.card }]}>
            <Text style={[styles.detailFieldLabel, { color: theme.text }]}>{col.name}</Text>
            <Text style={[styles.detailFieldPrompt, { color: theme.subtext }]}>{col.prompt}</Text>
            {col.type === 'date' ? (
              <>
                <TouchableOpacity style={[styles.dateButton, { backgroundColor: theme.inputBackground }]} onPress={() => setShowDatePicker(true)}>
                  <Ionicons name="calendar-outline" size={18} color={theme.subtext} style={styles.dateIcon} />
                  <Text style={[styles.dateButtonText, { color: theme.text }]}>
                    {inputValues[col.name] ? new Date(inputValues[col.name]).toLocaleDateString() : 'Select Date'}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={inputValues[col.name] ? new Date(inputValues[col.name]) : tempDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(event, date) => {
                      setShowDatePicker(false);
                      if (date) {
                        setTempDate(date);
                        handleInputChange(col.name, date.toISOString());
                      }
                    }}
                  />
                )}
              </>
            ) : col.type === 'time' ? (
              <>
                <TouchableOpacity style={[styles.dateButton, { backgroundColor: theme.inputBackground }]} onPress={() => setShowTimePicker(true)}>
                  <Ionicons name="time-outline" size={18} color={theme.subtext} style={styles.dateIcon} />
                  <Text style={[styles.dateButtonText, { color: theme.text }]}>
                    {inputValues[col.name] ? new Date(inputValues[col.name]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select Time'}
                  </Text>
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    value={inputValues[col.name] ? new Date(inputValues[col.name]) : tempTime}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, time) => {
                      setShowTimePicker(false);
                      if (time) {
                        setTempTime(time);
                        handleInputChange(col.name, time.toISOString());
                        if (selectedTask.type === 'daily' && inputValues.Days) {
                          scheduleNotification(time, inputValues.Days, selectedTask.text, selectedTask.id);
                        }
                      }
                    }}
                  />
                )}
              </>
            ) : col.type === 'select' && !col.multiple ? (
              <View style={styles.selectOptionsContainer}>
                {col.options.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.selectOption,
                      { backgroundColor: theme.inputBackground },
                      inputValues[col.name] === option && [styles.selectedOption, { backgroundColor: theme.accent + '20', borderColor: theme.accent }],
                    ]}
                    onPress={() => handleInputChange(col.name, option)}
                  >
                    <Text style={[styles.selectOptionText, { color: inputValues[col.name] === option ? theme.accent : theme.text }]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : col.type === 'select' && col.multiple ? (
              <View style={styles.selectOptionsContainer}>
                {col.options.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.selectOption,
                      { backgroundColor: theme.inputBackground },
                      (inputValues[col.name] || []).includes(option) && [styles.selectedOption, { backgroundColor: theme.accent + '20', borderColor: theme.accent }],
                    ]}
                    onPress={() => {
                      const currentDays = inputValues[col.name] || [];
                      const newDays = currentDays.includes(option) ? currentDays.filter((d) => d !== option) : [...currentDays, option];
                      handleInputChange(col.name, newDays);
                      if (col.name === 'Days' && inputValues.Time) {
                        scheduleNotification(new Date(inputValues.Time), newDays, selectedTask.text, selectedTask.id);
                      }
                    }}
                  >
                    <Text style={[styles.selectOptionText, { color: (inputValues[col.name] || []).includes(option) ? theme.accent : theme.text }]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <TextInput
                style={[styles.detailInput, { backgroundColor: theme.inputBackground, color: theme.text, height: col.multiline ? 100 : 50 }]}
                value={
                  col.bullet && inputValues[col.name]
                    ? inputValues[col.name].split('\n').map((line) => `• ${line}`).join('\n')
                    : inputValues[col.name] || ''
                }
                onChangeText={(text) => {
                  const processedText = col.bullet ? text.split('\n').map((line) => line.replace(/^•\s*/, '')).join('\n') : text;
                  handleInputChange(col.name, processedText);
                }}
                placeholder={`Enter ${col.name.toLowerCase()}`}
                placeholderTextColor={theme.subtext}
                multiline={col.multiline}
                textAlignVertical={col.multiline ? 'top' : 'center'}
              />
            )}
          </View>
        ))}
        <View style={styles.aiSuggestionContainer}>
          <LinearGradient colors={[theme.accent + '40', theme.accent + '10']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.aiSuggestion, { borderColor: theme.accent + '30' }]}>
            <View style={styles.aiSuggestionHeader}>
              <Ionicons name="bulb-outline" size={20} color={theme.accent} />
              <Text style={[styles.aiSuggestionTitle, { color: theme.text }]}>Pro Tip</Text>
            </View>
            <Text style={[styles.aiSuggestionText, { color: theme.subtext }]}>Upgrade to Pro for personalized AI suggestions on how to best accomplish this task.</Text>
          </LinearGradient>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Edit Profile Screen (unchanged)
const EditProfileScreen = ({ navigation }) => {
  const { theme, user, updateUser } = React.useContext(AppContext);
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePic, setProfilePic] = useState(null);

  const handleSave = () => {
    if (password && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    updateUser({ name, password: password || undefined, profilePic });
    navigation.goBack();
  };

  return (
    <View style={[styles.settingsContainer, { backgroundColor: theme.background }]}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.editProfileHeader}>
        <Text style={[styles.editProfileTitle, { color: theme.text }]}>Edit Profile</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={theme.subtext} />
        </TouchableOpacity>
      </Animated.View>
      <ScrollView contentContainerStyle={styles.editProfileContent}>
        <TouchableOpacity style={[styles.profilePicContainer, { backgroundColor: theme.card }]} onPress={() => {/* Add image picker logic here */}}>
          {profilePic ? <Image source={{ uri: profilePic }} style={styles.profilePic} /> : <Ionicons name="person" size={40} color={theme.accent} />}
          <Text style={[styles.changePicText, { color: theme.accent }]}>Change Picture</Text>
        </TouchableOpacity>
        <View style={[styles.inputContainer, { backgroundColor: theme.inputBackground }]}>
          <Ionicons name="person-outline" size={20} color={theme.subtext} style={styles.inputIcon} />
          <TextInput style={[styles.authInput, { color: theme.text }]} placeholder="Name" placeholderTextColor={theme.subtext} value={name} onChangeText={setName} />
        </View>
        <View style={[styles.inputContainer, { backgroundColor: theme.inputBackground }]}>
          <Ionicons name="lock-closed-outline" size={20} color={theme.subtext} style={styles.inputIcon} />
          <TextInput style={[styles.authInput, { color: theme.text }]} placeholder="New Password" placeholderTextColor={theme.subtext} value={password} onChangeText={setPassword} secureTextEntry />
        </View>
        <View style={[styles.inputContainer, { backgroundColor: theme.inputBackground }]}>
          <Ionicons name="lock-closed-outline" size={20} color={theme.subtext} style={styles.inputIcon} />
          <TextInput style={[styles.authInput, { color: theme.text }]} placeholder="Confirm New Password" placeholderTextColor={theme.subtext} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
        </View>
        <Button title="Save Changes" onPress={handleSave} style={styles.saveButton} />
      </ScrollView>
    </View>
  );
};

// Settings Screen (updated to use navigation)
const SettingsScreen = ({ navigation }) => {
  const { theme, setThemeKey, themeKey, logout, user, notificationsEnabled, setNotificationsEnabled } = React.useContext(AppContext);
  const availableThemes = [{ key: 'light', name: 'Light Mode' }, { key: 'dark', name: 'Dark Mode' }, { key: 'grayscale', name: 'Grayscale' }, { key: 'midnight', name: 'Midnight' }];
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [billingCycle, setBillingCycle] = useState('yearly');

  const SettingsOption = ({ icon, title, onPress, detail, showArrow = true, toggle, onToggle }) => {
    return (
      <TouchableOpacity style={[styles.settingsOption, { backgroundColor: theme.card }]} onPress={toggle !== undefined ? onToggle : onPress}>
        <View style={styles.settingsOptionContent}>
          <Ionicons name={icon} size={22} color={theme.accent} style={styles.settingsOptionIcon} />
          <Text style={[styles.settingsOptionTitle, { color: theme.text }]}>{title}</Text>
        </View>
        <View style={styles.settingsOptionRight}>
          {detail && <Text style={[styles.settingsOptionDetail, { color: theme.subtext }]}>{detail}</Text>}
          {toggle !== undefined && <Ionicons name={toggle ? "toggle-sharp" : "toggle-outline"} size={24} color={toggle ? theme.accent : theme.subtext} />}
          {showArrow && toggle === undefined && <Ionicons name="chevron-forward" size={18} color={theme.subtext} />}
        </View>
      </TouchableOpacity>
    );
  };

  const PremiumModal = () => (
    <Modal visible={showPremiumModal} transparent={true} animationType="fade" onRequestClose={() => setShowPremiumModal(false)}>
      <View style={styles.modalOverlay}>
        <Animated.View entering={FadeIn.duration(300)} style={[styles.premiumModal, { backgroundColor: theme.card }]}>
          <View style={styles.premiumModalHeader}>
            <Ionicons name="flash" size={30} color={theme.accent} />
            <Text style={[styles.premiumModalTitle, { color: theme.text }]}>Upgrade to Pro</Text>
            <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowPremiumModal(false)}>
              <Ionicons name="close" size={24} color={theme.subtext} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.premiumModalSubtitle, { color: theme.subtext }]}>Unlock premium features and take your productivity to the next level</Text>
          <View style={styles.premiumFeaturesList}>
            <View style={styles.premiumFeature}><Ionicons name="checkmark-circle" size={20} color={theme.accent} /><Text style={[styles.premiumFeatureText, { color: theme.text }]}>AI-powered task suggestions and insights</Text></View>
            <View style={styles.premiumFeature}><Ionicons name="checkmark-circle" size={20} color={theme.accent} /><Text style={[styles.premiumFeatureText, { color: theme.text }]}>Custom templates for recurring tasks</Text></View>
            <View style={styles.premiumFeature}><Ionicons name="checkmark-circle" size={20} color={theme.accent} /><Text style={[styles.premiumFeatureText, { color: theme.text }]}>Advanced task statistics and analytics</Text></View>
            <View style={styles.premiumFeature}><Ionicons name="checkmark-circle" size={20} color={theme.accent} /><Text style={[styles.premiumFeatureText, { color: theme.text }]}>Cloud backup and sync across devices</Text></View>
            <View style={styles.premiumFeature}><Ionicons name="checkmark-circle" size={20} color={theme.accent} /><Text style={[styles.premiumFeatureText, { color: theme.text }]}>Priority support and early access to new features</Text></View>
          </View>
          <View style={styles.pricingContainer}>
            <TouchableOpacity style={[styles.pricingOption, { backgroundColor: theme.inputBackground }, billingCycle === 'monthly' && { borderColor: theme.accent, borderWidth: 2 }]} onPress={() => setBillingCycle('monthly')}>
              <Text style={[styles.pricingTitle, { color: theme.text }]}>Monthly</Text>
              <Text style={[styles.pricingAmount, { color: theme.text }]}>$4.99</Text>
              <Text style={[styles.pricingPeriod, { color: theme.subtext }]}>per month</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pricingOption, billingCycle === 'yearly' && styles.popularPricing, { backgroundColor: theme.inputBackground }, billingCycle === 'yearly' && { borderColor: theme.accent, borderWidth: 2 }]} onPress={() => setBillingCycle('yearly')}>
              <View style={[styles.popularBadge, { backgroundColor: theme.accent }]}><Text style={styles.popularBadgeText}>Best value</Text></View>
              <Text style={[styles.pricingTitle, { color: theme.text }]}>Yearly</Text>
              <Text style={[styles.pricingAmount, { color: theme.text }]}>$39.99</Text>
              <Text style={[styles.pricingPeriod, { color: theme.subtext }]}>per year</Text>
              <Text style={[styles.savingsText, { color: theme.accent }]}>Save 33%</Text>
            </TouchableOpacity>
          </View>
          <Button title="Upgrade Now" onPress={() => setShowPremiumModal(false)} style={styles.upgradeButton} />
          <Text style={[styles.termsText, { color: theme.subtext }]}>Payment will be charged to your account at confirmation of purchase. Subscription automatically renews unless auto-renew is turned off at least 24-hours before the end of the current period.</Text>
        </Animated.View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.settingsContainer, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.primary === '#111827' ? 'dark-content' : 'light-content'} />
      <Animated.View entering={FadeIn.duration(800)} style={styles.profileContainer}>
        <View style={[styles.profileAvatarContainer, { backgroundColor: theme.card }]}>
          {user?.profilePic ? <Image source={{ uri: user.profilePic }} style={styles.profilePic} /> : <Ionicons name="person" size={40} color={theme.accent} />}
        </View>
        <Text style={[styles.profileName, { color: theme.text }]}>{user?.name || 'User'}</Text>
        <Text style={[styles.profileEmail, { color: theme.subtext }]}>{user?.email || 'user@example.com'}</Text>
      </Animated.View>
      <Animated.View entering={FadeIn.delay(200).duration(800)} style={styles.settingsGroup}>
        <Text style={[styles.settingsGroupTitle, { color: theme.subtext }]}>Account</Text>
        <SettingsOption icon="person-outline" title="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
        <SettingsOption icon="notifications-outline" title="Notifications" toggle={notificationsEnabled} onToggle={() => setNotificationsEnabled(prev => !prev)} />
        <SettingsOption icon="flash-outline" title="Upgrade to Pro" onPress={() => setShowPremiumModal(true)} />
      </Animated.View>
      <Animated.View entering={FadeIn.delay(300).duration(800)} style={styles.settingsGroup}>
        <Text style={[styles.settingsGroupTitle, { color: theme.subtext }]}>Appearance</Text>
        <Text style={[styles.themeSelectionLabel, { color: theme.text }]}>Theme</Text>
        <View style={styles.themeOptions}>
          {availableThemes.map(t => (
            <TouchableOpacity key={t.key} style={[styles.themeOption, { backgroundColor: themes[t.key].card }, themeKey === t.key && { borderColor: theme.accent, borderWidth: 2 }]} onPress={() => setThemeKey(t.key)}>
              <LinearGradient colors={[themes[t.key].background, themes[t.key].card]} style={styles.themePreview} />
              <Text style={[styles.themeOptionText, { color: themes[t.key].text }]}>{t.name}</Text>
              {themeKey === t.key && <View style={[styles.themeSelectedIcon, { backgroundColor: theme.accent }]}><Ionicons name="checkmark" size={14} color="#FFFFFF" /></View>}
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
      <Animated.View entering={FadeIn.delay(400).duration(800)} style={styles.settingsGroup}>
        <Text style={[styles.settingsGroupTitle, { color: theme.subtext }]}>General</Text>
        <SettingsOption icon="help-circle-outline" title="Help & Support" onPress={() => {}} />
        <SettingsOption icon="document-text-outline" title="Privacy Policy" onPress={() => {}} />
      </Animated.View>
      <Button title="Sign Out" onPress={logout} isPrimary={false} style={styles.signOutButton} />
      <PremiumModal />
    </View>
  );
};

// App Wrapper (corrected navigation structure)
const AppWrapper = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [themeKey, setThemeKey] = useState('dark');
  const [tasks, setTasks] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold, Montserrat_700Bold,
    Inter_400Regular, Inter_600SemiBold,
  });

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') setNotificationsEnabled(false);
    };
    requestPermissions();
    setTimeout(() => setIsLoading(false), 2000);
  }, []);

  if (!fontsLoaded && !fontError) return null;
  if (fontError) console.log('Font loading error:', fontError);

  const theme = themes[themeKey];

  const login = (email, password) => {
    if (email && password) setUser({ id: '123', name: 'John Developer', email });
    else Alert.alert('Error', 'Please enter email and password');
  };

  const register = (name, email, password, confirmPassword) => {
    if (name && email && password && password === confirmPassword) setUser({ id: '123', name, email });
    else if (password !== confirmPassword) Alert.alert('Error', 'Passwords do not match');
    else Alert.alert('Error', 'Please fill all fields');
  };

  const logout = () => {
    setUser(null);
    setTasks([]);
  };

  const updateUser = (updates) => setUser(prev => ({ ...prev, ...updates }));

  const analyzeTaskType = (text) => {
    const lowerText = text.toLowerCase();
    for (const [type, data] of Object.entries(taskDatabase)) {
      if (data.keywords && data.keywords.some(kw => lowerText.includes(kw))) return type;
    }
    return 'generic';
  };

  const addTask = (text) => {
    if (text.trim() === '') return;
    const taskType = analyzeTaskType(text);
    const newTask = {
      id: Date.now().toString(),
      text,
      type: taskType,
      createdAt: new Date().toISOString(),
      details: taskDatabase[taskType].columns.reduce((acc, col) => ({ ...acc, [col.name]: col.multiple ? [] : '' }), {}),
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
    showTaskCreatedToast(newTask);
  };

  const updateTaskDetail = (taskId, column, value) => {
    setTasks(prevTasks => prevTasks.map(task => task.id === taskId ? { ...task, details: { ...task.details, [column]: value } } : task));
  };

  const deleteTask = (taskId) => setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));

  const showTaskCreatedToast = (taskItem) => {
    setTimeout(() => Alert.alert('Task Created', `Tip: ${getAITip(taskItem.text, taskItem.type)}`, [{ text: 'OK' }]), 500);
  };

  const getAITip = (taskText, taskType) => {
    const lowerTask = taskText.toLowerCase();
    if (taskType === 'development') {
      if (lowerTask.includes('app')) return 'Start with a minimal prototype focused on core functionality.';
      if (lowerTask.includes('device')) return 'Check compatibility requirements before beginning.';
      return 'Create a small proof-of-concept first before expanding.';
    } else if (taskType === 'groceries') return 'Organize your shopping list by store sections to save time.';
    else if (taskType === 'chores') return 'Set a timer for 15 minutes and focus on one area only.';
    else if (taskType === 'daily') return 'Link this habit to an existing routine for better consistency.';
    return 'Break this down into smaller, actionable steps for better progress.';
  };

  const contextValue = {
    user, theme, themeKey, setThemeKey, tasks, setTasks, login, register, logout, addTask, updateTaskDetail, deleteTask, notificationsEnabled, setNotificationsEnabled, updateUser, showPremiumModal, setShowPremiumModal
  };

  const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );

  const MainTabs = () => (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.subtext,
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border, elevation: 0, shadowOpacity: 0, height: 60, paddingBottom: 8 },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Tasks') iconName = focused ? 'list' : 'list-outline';
          else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );

  const AppStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  );

  if (isLoading) return <AppContext.Provider value={{ theme }}><LoadingScreen /></AppContext.Provider>;

  return (
    <AppContext.Provider value={contextValue}>
      <NavigationContainer>
        {user ? <AppStack /> : <AuthStack />}
      </NavigationContainer>
    </AppContext.Provider>
  );
};

// Styles (unchanged)
const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 20, fontSize: 16, fontFamily: 'Montserrat_500Medium' },
  authContainer: { flex: 1, padding: 20, justifyContent: 'center' },
  authGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 300 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  appTitle: { fontSize: 32, fontFamily: 'Montserrat_700Bold', marginBottom: 8 },
  appSlogan: { fontSize: 16, fontFamily: 'Montserrat_400Regular' },
  formContainer: { width: '100%' },
  formTitle: { fontSize: 28, fontFamily: 'Montserrat_600SemiBold', marginBottom: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, marginBottom: 16, paddingHorizontal: 16, height: 56 },
  inputIcon: { marginRight: 12 },
  authInput: { flex: 1, height: '100%', fontSize: 16, fontFamily: 'Inter_400Regular' },
  passwordToggle: { padding: 8 },
  forgotPasswordLink: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotPasswordText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  signInButton: { height: 56, borderRadius: 12 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { paddingHorizontal: 16, fontSize: 14, fontFamily: 'Inter_400Regular' },
  createAccountButton: { height: 56, borderRadius: 12 },
  registerScrollView: { flex: 1 },
  loginLinkContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  loginLinkText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  loginLink: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  button: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 12 },
  buttonText: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  homeContainer: { flex: 1, padding: 20, paddingBottom: 80 },
  homeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Platform.OS === 'ios' ? 50 : 20, marginBottom: 24 },
  welcomeText: { fontSize: 24, fontFamily: 'Montserrat_600SemiBold', marginBottom: 4 },
  dateText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  avatarContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  statsContainer: { flexDirection: 'row', borderRadius: 16, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontFamily: 'Montserrat_700Bold', marginBottom: 4 },
  statLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  statDivider: { width: 1, marginHorizontal: 12 },
  quickAddContainer: { borderRadius: 16, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  quickAddTitle: { fontSize: 18, fontFamily: 'Montserrat_600SemiBold', marginBottom: 16 },
  quickAddInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  quickAddInputContainer: { flex: 1, borderRadius: 12, paddingHorizontal: 16, height: 50, marginRight: 12 },
  quickAddInput: { flex: 1, height: '100%', fontSize: 16, fontFamily: 'Inter_400Regular' },
  quickAddButton: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  quickAddTip: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  sectionTitle: { fontSize: 20, fontFamily: 'Montserrat_600SemiBold', marginBottom: 16 },
  viewAllButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 16, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  viewAllText: { fontSize: 16, fontFamily: 'Montserrat_500Medium' },
  emptyStateContainer: { borderRadius: 16, padding: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyStateText: { fontSize: 18, fontFamily: 'Montserrat_600SemiBold', marginTop: 16, marginBottom: 8 },
  emptyStateSubtext: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  premiumPromotionContainer: { marginVertical: 20 },
  premiumPromotion: { borderRadius: 16, padding: 20, borderWidth: 1 },
  premiumPromotionContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  premiumPromotionTextContainer: { marginLeft: 16, flex: 1 },
  premiumPromotionTitle: { fontSize: 18, fontFamily: 'Montserrat_600SemiBold', marginBottom: 4 },
  premiumPromotionSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  premiumPromotionButton: { padding: 12, borderRadius: 12, alignItems: 'center' },
  premiumPromotionButtonText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  tasksContainer: { flex: 1, padding: 20, paddingBottom: 80 },
  taskFiltersContainer: { marginTop: Platform.OS === 'ios' ? 50 : 20, marginBottom: 20 },
  categoryPickerContainer: { marginBottom: 16, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#4B5563' },
  categoryPicker: { height: 50, width: '100%' },
  sortByContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 },
  sortButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  sortButtonText: { fontSize: 12, fontFamily: 'Inter_400Regular', marginRight: 6 },
  tasksList: { paddingBottom: 80 },
  taskCard: { borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  taskCardContent: { flexDirection: 'row', alignItems: 'center' },
  taskIconContainer: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  taskInfoContainer: { flex: 1 },
  taskHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  taskTitle: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', flex: 1, marginRight: 8 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  priorityText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  taskDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskType: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  deadlineText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  deleteTaskButton: { padding: 8, marginLeft: 8 },
  emptyTasksContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTasksTitle: { fontSize: 20, fontFamily: 'Montserrat_600SemiBold', marginTop: 16, marginBottom: 8 },
  emptyTasksSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 20 },
  detailContainer: { flex: 1 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  detailIconContainer: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  detailTitleContainer: { flex: 1 },
  detailTitleText: { fontSize: 20, fontFamily: 'Montserrat_600SemiBold', marginBottom: 4 },
  detailTypeText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  closeDetailButton: { padding: 8 },
  detailScrollView: { flex: 1 },
  detailScrollContent: { padding: 20, paddingBottom: 80 },
  detailField: { borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  detailFieldLabel: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', marginBottom: 4 },
  detailFieldPrompt: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 12 },
  dateButton: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, height: 50 },
  dateIcon: { marginRight: 8 },
  dateButtonText: { fontSize: 16, fontFamily: 'Inter_400Regular' },
  selectOptionsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  selectOption: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  selectedOption: { borderWidth: 1 },
  selectOptionText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  detailInput: { borderRadius: 8, padding: 12, fontSize: 16, fontFamily: 'Inter_400Regular' },
  aiSuggestionContainer: { marginTop: 20 },
  aiSuggestion: { borderRadius: 12, padding: 16, borderWidth: 1 },
  aiSuggestionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  aiSuggestionTitle: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', marginLeft: 8 },
  aiSuggestionText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  settingsContainer: { flex: 1, padding: 20, paddingTop: Platform.OS === 'ios' ? 50 : 30 },
  profileContainer: { alignItems: 'center', marginBottom: 32 },
  profileAvatarContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  profilePic: { width: '100%', height: '100%', borderRadius: 40 },
  profileName: { fontSize: 24, fontFamily: 'Montserrat_600SemiBold', marginBottom: 4 },
  profileEmail: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  settingsGroup: { marginBottom: 32 },
  settingsGroupTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 12 },
  settingsOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  settingsOptionContent: { flexDirection: 'row', alignItems: 'center' },
  settingsOptionIcon: { marginRight: 12 },
  settingsOptionTitle: { fontSize: 16, fontFamily: 'Montserrat_500Medium' },
  settingsOptionRight: { flexDirection: 'row', alignItems: 'center' },
  settingsOptionDetail: { fontSize: 14, fontFamily: 'Inter_400Regular', marginRight: 8 },
  themeSelectionLabel: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', marginBottom: 12 },
  themeOptions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  themeOption: { 
    width: (width - 60) / 2, 
    borderRadius: 12, 
    padding: 12, 
    alignItems: 'center', 
    marginBottom: 12, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 10, 
    elevation: 2 
  },
  themePreview: { 
    width: '100%', 
    height: 60, 
    borderRadius: 8, 
    marginBottom: 8 
  },
  themeOptionText: { 
    fontSize: 14, 
    fontFamily: 'Montserrat_500Medium' 
  },
  themeSelectedIcon: { 
    position: 'absolute', 
    top: 8, 
    right: 8, 
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  signOutButton: { 
    height: 56, 
    borderRadius: 12, 
    marginTop: 20 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  premiumModal: { 
    width: width - 40, 
    borderRadius: 16, 
    padding: 20, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 10, 
    elevation: 5 
  },
  premiumModalHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  premiumModalTitle: { 
    fontSize: 24, 
    fontFamily: 'Montserrat_600SemiBold', 
    marginLeft: 12, 
    flex: 1 
  },
  closeModalButton: { 
    padding: 8 
  },
  premiumModalSubtitle: { 
    fontSize: 14, 
    fontFamily: 'Inter_400Regular', 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  premiumFeaturesList: { 
    marginBottom: 20 
  },
  premiumFeature: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  premiumFeatureText: { 
    fontSize: 14, 
    fontFamily: 'Inter_400Regular', 
    marginLeft: 8, 
    flex: 1 
  },
  pricingContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 20 
  },
  pricingOption: { 
    width: (width - 80) / 2, 
    borderRadius: 12, 
    padding: 16, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  popularPricing: { 
    position: 'relative' 
  },
  popularBadge: { 
    position: 'absolute', 
    top: -10, 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12 
  },
  popularBadgeText: { 
    fontSize: 12, 
    fontFamily: 'Montserrat_600SemiBold', 
    color: '#FFFFFF' 
  },
  pricingTitle: { 
    fontSize: 16, 
    fontFamily: 'Montserrat_600SemiBold', 
    marginBottom: 4 
  },
  pricingAmount: { 
    fontSize: 24, 
    fontFamily: 'Montserrat_700Bold', 
    marginBottom: 4 
  },
  pricingPeriod: { 
    fontSize: 12, 
    fontFamily: 'Inter_400Regular' 
  },
  savingsText: { 
    fontSize: 12, 
    fontFamily: 'Inter_600SemiBold', 
    marginTop: 4 
  },
  upgradeButton: { 
    height: 56, 
    borderRadius: 12, 
    marginBottom: 12 
  },
  termsText: { 
    fontSize: 12, 
    fontFamily: 'Inter_400Regular', 
    textAlign: 'center' 
  },
  editProfileHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 24 
  },
  editProfileTitle: { 
    fontSize: 24, 
    fontFamily: 'Montserrat_600SemiBold' 
  },
  editProfileContent: { 
    paddingBottom: 80 
  },
  profilePicContainer: { 
    alignItems: 'center', 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 24, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 10, 
    elevation: 2 
  },
  changePicText: { 
    fontSize: 14, 
    fontFamily: 'Inter_600SemiBold', 
    marginTop: 12 
  },
  saveButton: { 
    height: 56, 
    borderRadius: 12, 
    marginTop: 20 
  },
});

export default AppWrapper;