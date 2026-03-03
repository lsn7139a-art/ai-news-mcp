import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  DashboardOutlined, 
  CarOutlined, 
  UserOutlined, 
  PlusOutlined, 
  SearchOutlined,
  LogoutOutlined,
  BellOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

const { Header } = Layout;

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { connected } = useSocket();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">仪表板</Link>,
    },
    {
      key: '/create-ride',
      icon: <PlusOutlined />,
      label: <Link to="/create-ride">发布拼车</Link>,
    },
    {
      key: '/rides',
      icon: <CarOutlined />,
      label: <Link to="/rides">拼车列表</Link>,
    },
    {
      key: '/matching',
      icon: <SearchOutlined />,
      label: <Link to="/matching">智能匹配</Link>,
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link to="/profile">个人资料</Link>,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <Header style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      background: '#fff',
      borderBottom: '1px solid #f0f0f0',
      padding: '0 24px'
    }}>
      <div className="logo" style={{ 
        fontSize: '18px', 
        fontWeight: 'bold', 
        color: '#1890ff',
        marginRight: '24px'
      }}>
        🚗 校园拼车
      </div>
      
      <Menu
        mode="horizontal"
        selectedKeys={[location.pathname]}
        items={menuItems}
        style={{ 
          flex: 1, 
          border: 'none',
          backgroundColor: 'transparent'
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* 连接状态指示器 */}
        <Badge 
          status={connected ? 'success' : 'error'} 
          text={connected ? '已连接' : '离线'} 
        />

        {/* 通知图标 */}
        <Badge count={0} size="small">
          <BellOutlined style={{ fontSize: '18px', color: '#666' }} />
        </Badge>

        {/* 用户头像和下拉菜单 */}
        <Dropdown
          menu={{ items: userMenuItems }}
          placement="bottomRight"
          arrow
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'background-color 0.3s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Avatar 
              size="small" 
              icon={<UserOutlined />} 
              style={{ backgroundColor: '#1890ff' }}
            />
            <span style={{ color: '#666' }}>{user?.username}</span>
          </div>
        </Dropdown>
      </div>
    </Header>
  );
};

export default Navigation;