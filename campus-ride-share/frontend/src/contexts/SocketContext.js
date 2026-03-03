import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { message } from 'antd';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const newSocket = io('http://localhost:3001', {
        auth: {
          token: token
        }
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
      });

      // 监听实时事件
      newSocket.on('ride_updated', (data) => {
        const { action, ride_request_id, passenger_count } = data;
        
        switch (action) {
          case 'passenger_joined':
            message.info(`有新用户加入了拼车 #${ride_request_id}，当前乘客数：${passenger_count}`);
            break;
          case 'cancelled':
            message.warning(`拼车 #${ride_request_id} 已被取消`);
            break;
          default:
            break;
        }
      });

      newSocket.on('match_updated', (data) => {
        const { match_id, status } = data;
        
        switch (status) {
          case 'accepted':
            message.success(`匹配 #${match_id} 已被接受`);
            break;
          case 'rejected':
            message.info(`匹配 #${match_id} 已被拒绝`);
            break;
          case 'completed':
            message.success(`匹配 #${match_id} 已完成`);
            break;
          default:
            break;
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, []);

  const joinRoom = (room) => {
    if (socket && connected) {
      socket.emit('join_room', room);
    }
  };

  const leaveRoom = (room) => {
    if (socket && connected) {
      socket.emit('leave_room', room);
    }
  };

  const value = {
    socket,
    connected,
    joinRoom,
    leaveRoom
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};