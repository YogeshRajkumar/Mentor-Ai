import Dashboard from "../components/Dashboard";

function DashboardPage({ tasks, onAddTask, onToggle, onDelete }) {
  return <Dashboard tasks={tasks} onAddTask={onAddTask} onToggle={onToggle} onDelete={onDelete} />;
}

export default DashboardPage;
