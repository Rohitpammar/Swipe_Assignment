import React from 'react';
import { Layout, Tabs, Typography } from 'antd';
import IntervieweePage from './pages/IntervieweePage';
import InterviewerPage from './pages/InterviewerPage';

const { Header, Content } = Layout;
const { Title } = Typography;

function App() {
  return (
    <Layout style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <Header style={{ 
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Title level={1} style={{ 
          color: '#fff', 
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: '700',
          margin: 0,
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          letterSpacing: '-0.02em'
        }}>
          🎯 Interview Platform
        </Title>
      </Header>
      <Content style={{ 
        padding: '16px',
        background: 'transparent',
        height: 'calc(100vh - 80px)',
        overflow: 'auto'
      }}>
        <Tabs 
          defaultActiveKey="interviewee"
          size="large"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
          tabBarStyle={{
            fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
            fontWeight: '600',
            marginBottom: '24px'
          }}
        >
          <Tabs.TabPane 
            tab={<span style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', fontWeight: '600' }}>👤 Interviewee</span>} 
            key="interviewee"
          >
            <IntervieweePage />
          </Tabs.TabPane>
          <Tabs.TabPane 
            tab={<span style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', fontWeight: '600' }}>👥 Interviewer</span>} 
            key="interviewer"
          >
            <InterviewerPage />
          </Tabs.TabPane>
        </Tabs>
      </Content>
    </Layout>
  );
}

export default App;
