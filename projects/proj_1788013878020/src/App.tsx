import React, { useState } from 'react';
import './App.css';

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { id: Date.now(), text: newTask, completed: false }]);
      setNewTask('');
    }
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => (task.id === id ? { ...task, completed: !task.completed } : task)));
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <div className="app">
      <h1>Todo App</h1>
      <div className="input-container">
        <input
          type="text"
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          placeholder="Add a new task"
        />
        <button onClick={addTask}>Add</button>
      </div>
      <h2>Pending Tasks</h2>
      <ul>
        {pendingTasks.map(task => (
          <li key={task.id}>
            <span
              style={{ textDecoration: task.completed ? 'line-through' : 'none' }}
              onClick={() => toggleTask(task.id)}
            >
              {task.text}
            </span>
            <button onClick={() => deleteTask(task.id)}>Delete</button>
          </li>
        ))}
      </ul>
      <h2>Completed Tasks</h2>
      <ul>
        {completedTasks.map(task => (
          <li key={task.id}>
            <span
              style={{ textDecoration: task.completed ? 'line-through' : 'none' }}
              onClick={() => toggleTask(task.id)}
            >
              {task.text}
            </span>
            <button onClick={() => deleteTask(task.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;