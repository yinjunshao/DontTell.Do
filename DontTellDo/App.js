
import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert, StyleSheet } from 'react-native';

const App = () => {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);

  const addTask = () => {
    if (!task) return;
    const newTask = { id: Date.now().toString(), text: task };
    setTasks([...tasks, newTask]);
    setTask('');
    setTimeout(() => {
      Alert.alert('Reminder', `${newTask.text}\nTip: ${getTip(newTask.text)}`);
    }, 5000);
  };

  const getTip = (task) => {
    if (task.toLowerCase().includes('exercise')) return 'Start with a quick stretch.';
    if (task.toLowerCase().includes('study')) return 'Set a 10-minute timer.';
    return 'Break it into one small step.';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DontTell.Do</Text>
      <TextInput
        style={styles.input}
        placeholder="Your task..."
        value={task}
        onChangeText={setTask}
      />
      <Button title="Add" onPress={addTask} />
      <FlatList
        data={tasks}
        renderItem={({ item }) => <Text style={styles.task}>{item.text}</Text>}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  input: { borderWidth: 1, padding: 8, marginVertical: 10 },
  task: { padding: 10, fontSize: 16 },
});

export default App;
