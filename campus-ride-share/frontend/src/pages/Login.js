import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Row, Col } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const Login = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const result = await login(values);
      if (result.success) {
        navigate('/dashboard');
      }
    } catch (error) {
      message.error('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Row justify="center" style={{ width: '100%', maxWidth: '400px' }}>
        <Col span={24}>
          <Card
            style={{
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
              borderRadius: '12px'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Title level={2} style={{ color: '#1890ff', marginBottom: '8px' }}>
                🚗 校园拼车平台
              </Title>
              <Text type="secondary">
                基于三重匹配算法的高信任拼车系统
              </Text>
            </div>

            <Form
              form={form}
              name="login"
              onFinish={onFinish}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="username"
                label="学号"
                rules={[
                  { required: true, message: '请输入学号' },
                  { pattern: /^\d{6}$/, message: '学号格式：6位数字' }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="请输入6位学号"
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="密码"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6位' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="请输入密码"
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  style={{
                    height: '48px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  登录
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Text>
                还没有账号？
                <Link to="/register" style={{ color: '#1890ff', fontWeight: 'bold' }}>
                  立即注册
                </Link>
              </Text>
            </div>

            <div style={{ 
              marginTop: '24px', 
              padding: '16px', 
              background: '#f6f8fa',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#666'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>🎯 核心特性</div>
              <div>• 专业相似度匹配 (40%)</div>
              <div>• 性格兼容度分析 (30%)</div>
              <div>• 时间精准度匹配 (30%)</div>
              <div>• 实时智能推荐</div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Login;