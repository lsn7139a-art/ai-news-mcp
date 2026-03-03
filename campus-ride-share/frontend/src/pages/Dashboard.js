import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Typography, 
  Button, 
  List, 
  Tag, 
  message,
  Spin
} from 'antd';
import { 
  CarOutlined, 
  UserOutlined, 
  ClockCircleOutlined,
  TrophyOutlined,
  PlusOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ridesAPI, matchesAPI } from '../services/api';

const { Title, Text } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentRides, setRecentRides] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 获取统计数据
      const statsResponse = await matchesAPI.getMatchStats();
      setStats(statsResponse.data);

      // 获取最近拼车
      const ridesResponse = await ridesAPI.getRides({ limit: 5 });
      setRecentRides(ridesResponse.data.ride_requests || []);

      // 获取最近匹配
      const matchesResponse = await matchesAPI.getMatchHistory({ limit: 5 });
      setRecentMatches(matchesResponse.data.matches || []);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      'active': 'green',
      'completed': 'blue',
      'cancelled': 'red',
      'pending': 'orange'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      'active': '进行中',
      'completed': '已完成',
      'cancelled': '已取消',
      'pending': '待确认'
    };
    return texts[status] || status;
  };

  return (
    <div>
      {/* 欢迎区域 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          👋 欢迎回来，{user?.username}
        </Title>
        <Text type="secondary">
          {user?.major} | 性格类型：{user?.personality}
        </Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日拼车"
              value={stats.today_rides || 0}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={stats.active_users || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="成功匹配"
              value={stats.successful_matches || 0}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="匹配成功率"
              value={stats.match_success_rate || 0}
              suffix="%"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 快速操作 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card title="快速操作">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  block
                  onClick={() => navigate('/create-ride')}
                  style={{ height: '60px' }}
                >
                  发布拼车
                </Button>
              </Col>
              <Col xs={24} sm={8}>
                <Button
                  type="default"
                  size="large"
                  icon={<EyeOutlined />}
                  block
                  onClick={() => navigate('/rides')}
                  style={{ height: '60px' }}
                >
                  浏览拼车
                </Button>
              </Col>
              <Col xs={24} sm={8}>
                <Button
                  type="default"
                  size="large"
                  icon={<TrophyOutlined />}
                  block
                  onClick={() => navigate('/matching')}
                  style={{ height: '60px' }}
                >
                  智能匹配
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 最近活动和匹配 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="最新拼车" extra={<Button type="link" onClick={() => navigate('/rides')}>查看全部</Button>}>
            <List
              dataSource={recentRides}
              renderItem={(ride) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <div>
                        <span>{ride.station_name}</span>
                        <Tag color={getStatusColor(ride.status)} style={{ marginLeft: '8px' }}>
                          {getStatusText(ride.status)}
                        </Tag>
                      </div>
                    }
                    description={
                      <div>
                        <div>出发时间：{new Date(ride.departure_time).toLocaleString()}</div>
                        <div>乘客数：{ride.passenger_count}/4 | 发布者：{ride.creator_name}</div>
                      </div>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: '暂无拼车信息' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="最近匹配" extra={<Button type="link" onClick={() => navigate('/matching')}>查看全部</Button>}>
            <List
              dataSource={recentMatches}
              renderItem={(match) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <div>
                        <span>匹配 #{match.match_id}</span>
                        <Tag color={getStatusColor(match.status)} style={{ marginLeft: '8px' }}>
                          {getStatusText(match.status)}
                        </Tag>
                        {match.total_score >= 20 && (
                          <Tag color="gold" style={{ marginLeft: '4px' }}>
                            高匹配 {match.total_score}分
                          </Tag>
                        )}
                      </div>
                    }
                    description={
                      <div>
                        <div>匹配时间：{new Date(match.created_at).toLocaleString()}</div>
                        <div>匹配得分：{match.breakdown}</div>
                      </div>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: '暂无匹配信息' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;