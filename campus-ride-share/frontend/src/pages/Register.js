import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Select, Row, Col, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const MAJORS = [
  '计算机科学',
  '软件工程',
  '电子信息工程',
  '机械工程',
  '土木工程',
  '化学工程',
  '生物工程',
  '数学与应用数学',
  '物理学',
  '经济学',
  '管理学',
  '外语'
];

const PERSONALITY_LABELS = {
  1: '内向型',
  2: '偏内向',
  3: '中间型',
  4: '偏外向',
  5: '外向型'
};

const Register = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const result = await register(values);
      if (result.success) {
        navigate('/dashboard');
      }
    } catch (error) {
      message.error('注册失败，请重试');
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
      <Row justify="center" style={{ width: '100%', maxWidth: '500px' }}>
        <Col span={24}>
          <Card
            style={{
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
              borderRadius: '12px'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Title level={2} style={{ color: '#1890ff', marginBottom: '8px' }}>
                🎓 注册账号
              </Title>
              <Text type="secondary">
                加入校园拼车，开启智能出行
              </Text>
            </div>

            <Form
              form={form}
              name="register"
              onFinish={onFinish}
              layout="vertical"
              size="large"
            >
              <Row gutter={16}>
                <Col span={12}>
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
                      placeholder="6位学号"
                      style={{ borderRadius: '8px' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="student_id"
                    label="真实学号"
                    rules={[
                      { required: true, message: '请输入真实学号' },
                      { pattern: /^\d{8,12}$/, message: '学号格式：8-12位数字' }
                    ]}
                  >
                    <Input
                      placeholder="8-12位学号"
                      style={{ borderRadius: '8px' }}
                    />
                  </Form.Item>
                </Col>
              </Row>

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
                  placeholder="至少6位密码"
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>

              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '邮箱格式不正确' }
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="用于接收通知"
                  style={{ borderRadius: '8px' }}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="major"
                    label="专业"
                    rules={[{ required: true, message: '请选择专业' }]}
                  >
                    <Select
                      placeholder="选择专业"
                      style={{ borderRadius: '8px' }}
                    >
                      {MAJORS.map(major => (
                        <Option key={major} value={major}>{major}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="personality"
                    label="性格类型"
                    rules={[{ required: true, message: '请选择性格类型' }]}
                  >
                    <Select
                      placeholder="选择性格类型"
                      style={{ borderRadius: '8px' }}
                    >
                      {Object.entries(PERSONALITY_LABELS).map(([value, label]) => (
                        <Option key={value} value={parseInt(value)}>
                          {value} - {label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

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
                  注册账号
                </Button>
              </Form.Item>
            </Form>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Text>
                已有账号？
                <Link to="/login" style={{ color: '#1890ff', fontWeight: 'bold' }}>
                  立即登录
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
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>💡 注册说明</div>
              <div>• 学号实名认证，确保信任度</div>
              <div>• 专业和性格信息用于智能匹配</div>
              <div>• 邮箱用于接收拼车通知</div>
              <div>• 信息仅用于匹配，严格保密</div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Register;