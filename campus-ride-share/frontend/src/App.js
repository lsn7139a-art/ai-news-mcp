import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import { useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateRide from './pages/CreateRide';
import RideList from './pages/RideList';
import Matching from './pages/Matching';
import Profile from './pages/Profile';
import './App.css';

const { Content } = Layout;

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div>加载中...</div>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {user && <Navigation />}
      <Content style={{ padding: user ? '24px' : '0' }}>
        <Routes>
          {/* 未登录用户的路由 */}
          {!user && (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          )}
          
          {/* 已登录用户的路由 */}
          {user && (
            <>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/create-ride" element={<CreateRide />} />
              <Route path="/rides" element={<RideList />} />
              <Route path="/matching" element={<Matching />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
          )}
        </Routes>
      </Content>
    </Layout>
  );
}

export default App;