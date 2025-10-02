
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectFilteredAndSortedCandidates, selectSearchQuery, selectSortConfig, selectFilterRating, selectCandidateCount, setSearchQuery, setSortBy, setSortOrder, setFilterRating, selectCandidateById,
} from '../store/candidatesSlice';
import {
  Table, Input, Select, Button, Space, Card, Tag, Modal, Descriptions, Collapse, List, Badge, Empty, Row, Col, Statistic, Progress, Typography, Divider,
} from 'antd';
import {
  SearchOutlined, TrophyOutlined, UserOutlined, ExclamationCircleTwoTone,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;
const { Panel } = Collapse;

const ratingColors = {
  'Excellent': 'green',
  'Good': 'blue',
  'Fair': 'orange',
  'Needs Improvement': 'red',
};

function InterviewerPage() {
  const dispatch = useDispatch();
  const candidates = useSelector(selectFilteredAndSortedCandidates);
  const searchQuery = useSelector(selectSearchQuery);
  const { sortBy, sortOrder } = useSelector(selectSortConfig);
  const filterRating = useSelector(selectFilterRating);
  const candidateCount = useSelector(selectCandidateCount);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const selectedCandidate = useSelector(state => selectCandidateById(state, selectedCandidateId));

  // Table columns
  const columns = [
    {
      title: <TrophyOutlined title="Rank" />, dataIndex: 'rank', key: 'rank',
  render: (_, __, index) => {
        if (index === 0) return <TrophyOutlined style={{ color: '#faad14', fontSize: 20 }} title="Top Candidate" />;
        if (index === 1) return <TrophyOutlined style={{ color: '#bfbfbf', fontSize: 18 }} title="2nd Place" />;
        if (index === 2) return <TrophyOutlined style={{ color: '#cd7f32', fontSize: 16 }} title="3rd Place" />;
        return index + 1;
      },
      width: 60,
    },
    {
      title: 'Name', dataIndex: 'name', key: 'name',
      render: (text, record) => <span><UserOutlined /> <Button type="link" onClick={e => { e.stopPropagation(); setSelectedCandidateId(record.id); setDetailModalOpen(true); }}>{text}</Button></span>,
      sorter: true,
      sortOrder: sortBy === 'name' ? sortOrder + 'end' : false,
    },
    {
      title: 'Email', dataIndex: 'email', key: 'email',
      render: text => <span>{text}</span>,
    },
    {
      title: 'Score', dataIndex: 'finalScore', key: 'finalScore',
  render: (_, record) => <span>{record.finalScore} / {record.maxScore} <Progress percent={Math.round((record.finalScore / record.maxScore) * 100)} size="small" showInfo={false} style={{ width: 60, marginLeft: 8 }} /></span>,
      sorter: true,
      sortOrder: sortBy === 'finalScore' ? sortOrder + 'end' : false,
    },
    {
      title: 'Percentage', dataIndex: 'scorePercentage', key: 'scorePercentage',
      render: pct => {
        let color = 'red';
        if (pct >= 80) color = 'green';
        else if (pct >= 60) color = 'blue';
        else if (pct >= 40) color = 'orange';
        return <span style={{ color, fontWeight: 600 }}>{pct}%</span>;
      },
      sorter: true,
      sortOrder: sortBy === 'scorePercentage' ? sortOrder + 'end' : false,
    },
    {
      title: 'Rating', dataIndex: 'rating', key: 'rating',
      render: rating => <Tag color={ratingColors[rating] || 'default'}>{rating}</Tag>,
      filters: [
        { text: 'Excellent', value: 'Excellent' },
        { text: 'Good', value: 'Good' },
        { text: 'Fair', value: 'Fair' },
        { text: 'Needs Improvement', value: 'Needs Improvement' },
      ],
      filteredValue: filterRating !== 'All' ? [filterRating] : null,
    },
    {
      title: 'Completed At', dataIndex: 'interviewCompletedAt', key: 'interviewCompletedAt',
      render: val => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '',
      sorter: true,
      sortOrder: sortBy === 'interviewCompletedAt' ? sortOrder + 'end' : false,
    },
    {
      title: 'Actions', key: 'actions',
  render: (_, record) => <Button type="link" onClick={e => { e.stopPropagation(); setSelectedCandidateId(record.id); setDetailModalOpen(true); }}>View Details</Button>,
    },
  ];

  // Table onChange handler for sort
  const handleTableChange = (_, filters, sorter) => {
    if (sorter && sorter.field) {
      dispatch(setSortBy(sorter.field));
      dispatch(setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc'));
    }
    if (filters && filters.rating && filters.rating.length) {
      dispatch(setFilterRating(filters.rating[0]));
    }
  };

  // Search and filter controls
  const ratingOptions = [
    { label: 'All', value: 'All' },
    { label: 'Excellent', value: 'Excellent' },
    { label: 'Good', value: 'Good' },
    { label: 'Fair', value: 'Fair' },
    { label: 'Needs Improvement', value: 'Needs Improvement' },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', height: '100%', padding: '20px' }}>
      <Card style={{
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
      }}>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              prefix={<SearchOutlined style={{ fontSize: '1.2rem', color: '#6366f1' }} />}
              placeholder="Search by name, email, or phone"
              value={searchQuery}
              onChange={e => dispatch(setSearchQuery(e.target.value))}
              allowClear
              size="large"
              style={{ 
                width: '100%',
                fontSize: '1.1rem',
                height: '48px',
                borderRadius: '12px',
                border: '2px solid #e5e7eb'
              }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              options={ratingOptions}
              value={filterRating}
              onChange={val => dispatch(setFilterRating(val))}
              size="large"
              style={{ 
                width: '100%',
                fontSize: '1.1rem',
                height: '48px'
              }}
              placeholder="Filter by Rating"
            />
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Statistic 
              title={<span style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)', fontWeight: '600' }}>Total Candidates</span>} 
              value={candidateCount} 
              prefix={<UserOutlined style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.4rem)', color: '#6366f1' }} />}
              valueStyle={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: '700', color: '#1f2937' }}
            />
          </Col>
        </Row>
      </Card>
      <Card style={{
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        <Table
          dataSource={candidates}
          columns={columns}
          rowKey="id"
          pagination={{ 
            pageSize: 15, 
            showSizeChanger: true, 
            showTotal: total => `Total ${total} candidates`,
            style: { fontSize: '1.1rem' },
            showQuickJumper: true,
            showLessItems: true
          }}
          onChange={handleTableChange}
          sortDirections={[ 'descend', 'ascend' ]}
          locale={{ 
            emptyText: <Empty 
              description="No candidates yet. Complete an interview in the Interviewee tab to see results here." 
              style={{ fontSize: '1.1rem' }}
            /> 
          }}
          onRow={record => ({
            onClick: () => { setSelectedCandidateId(record.id); setDetailModalOpen(true); },
            style: { 
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }
          })}
          rowClassName={() => 'clickable-row'}
          style={{ fontSize: '1.1rem' }}
          size="middle"
        />
      </Card>
      {/* Detail Modal */}
      <Modal
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        width="90vw"
        style={{ maxWidth: '1400px' }}
        footer={
          <Button 
            onClick={() => setDetailModalOpen(false)}
            size="large"
            style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              height: '48px',
              padding: '0 32px',
              borderRadius: '12px'
            }}
          >
            Close
          </Button>
        }
        title={
          <span style={{ fontSize: '1.4rem', fontWeight: '600' }}>
            {selectedCandidate ? `👤 ${selectedCandidate.name} - Interview Details` : 'Candidate Details'}
          </span>
        }
        destroyOnClose
      >
        {selectedCandidate ? (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Profile Section */}
            <Card title="Candidate Profile">
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Name">{selectedCandidate.name}</Descriptions.Item>
                <Descriptions.Item label="Email">{selectedCandidate.email}</Descriptions.Item>
                <Descriptions.Item label="Phone">{selectedCandidate.phone}</Descriptions.Item>
                <Descriptions.Item label="Resume File">{selectedCandidate.resumeFileName}</Descriptions.Item>
                <Descriptions.Item label="Uploaded At">{selectedCandidate.uploadedAt ? dayjs(selectedCandidate.uploadedAt).format('YYYY-MM-DD HH:mm') : ''}</Descriptions.Item>
                <Descriptions.Item label="Interview Completed At">{selectedCandidate.interviewCompletedAt ? dayjs(selectedCandidate.interviewCompletedAt).format('YYYY-MM-DD HH:mm') : ''}</Descriptions.Item>
              </Descriptions>
            </Card>
            {/* Score Overview Section */}
            <Card title="Interview Score">
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={12} md={8}>
                  <Statistic title="Total Score" value={selectedCandidate.finalScore} suffix={`/ ${selectedCandidate.maxScore}`} />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Statistic title="Percentage" value={selectedCandidate.scorePercentage} suffix="%" />
                </Col>
                <Col xs={24} sm={24} md={8} style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={selectedCandidate.scorePercentage}
                    strokeColor={ratingColors[selectedCandidate.rating] || 'blue'}
                    width={80}
                    format={p => `${p}%`}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Tag color={ratingColors[selectedCandidate.rating] || 'blue'} style={{ fontSize: 16 }}>{selectedCandidate.rating}</Tag>
                  </div>
                </Col>
              </Row>
              <Divider />
              <Text strong>Recommendation:</Text> {selectedCandidate.recommendation}
            </Card>
            {/* AI Summary Section */}
            <Card title="AI Summary">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Text strong>Strengths:</Text>
                  {selectedCandidate.summary?.overallStrengths?.length ? (
                    <ul>
                      {selectedCandidate.summary.overallStrengths.map((s, i) => <li key={i}><Tag color="green">{s}</Tag></li>)}
                    </ul>
                  ) : <Empty description="No strengths detected" />}
                </Col>
                <Col xs={24} md={12}>
                  <Text strong>Areas for Improvement:</Text>
                  {selectedCandidate.summary?.overallWeaknesses?.length ? (
                    <ul>
                      {selectedCandidate.summary.overallWeaknesses.map((w, i) => <li key={i}><Tag color="orange">{w}</Tag></li>)}
                    </ul>
                  ) : <Empty description="No weaknesses detected" />}
                </Col>
              </Row>
              <Divider />
              <Text strong>Time Management:</Text> {selectedCandidate.summary?.timeManagement}
              <Divider />
              <Text strong>Category Breakdown:</Text>
              <List
                dataSource={selectedCandidate.summary?.categoryBreakdown || []}
                renderItem={cat => (
                  <List.Item>
                    <span style={{ minWidth: 120, display: 'inline-block' }}>{cat.category}:</span>
                    <Progress percent={Math.round((cat.avgScore / (cat.category === 'Hard' ? 20 : cat.category === 'Medium' ? 15 : 10)) * 100)} size="small" status="active" style={{ width: 120 }} />
                    <span style={{ marginLeft: 8 }}>Avg Score: {cat.avgScore}</span>
                  </List.Item>
                )}
              />
            </Card>
            {/* Chat Transcript Section */}
            <Card title="Question-by-Question Breakdown">
              <Collapse accordion>
                {selectedCandidate.answers.map((ans, i) => (
                  <Panel
                    header={<span>Q{i + 1}: <Badge count={ans.difficulty} style={{ backgroundColor: '#1890ff' }} /> <span style={{ marginLeft: 8 }}>{selectedCandidate.scores[i]?.score || 0}/10</span></span>}
                    key={i}
                  >
                    <Text strong>Question:</Text> {ans.question}<br />
                    <Text strong>Answer:</Text>
                    <div style={{ background: '#f6f6f6', padding: 8, borderRadius: 4, margin: '8px 0' }}><Text code>{ans.answer || '(No answer)'}</Text></div>
                    <Text strong>AI Feedback:</Text> {selectedCandidate.scores[i]?.feedback}<br />
                    <Text strong>Strengths:</Text> {selectedCandidate.scores[i]?.strengths?.length ? selectedCandidate.scores[i].strengths.map((s, j) => <Tag color="green" key={j}>{s}</Tag>) : <Text type="secondary">None</Text>}<br />
                    <Text strong>Improvements:</Text> {selectedCandidate.scores[i]?.improvements?.length ? selectedCandidate.scores[i].improvements.map((w, j) => <Tag color="orange" key={j}>{w}</Tag>) : <Text type="secondary">None</Text>}<br />
                    <Text strong>Time Spent:</Text> {ans.timeSpent}s {ans.autoSubmitted && <ExclamationCircleTwoTone twoToneColor="#faad14" title="Auto-submitted" />}<br />
                  </Panel>
                ))}
              </Collapse>
            </Card>
          </Space>
        ) : <Empty description="No candidate selected" />}
      </Modal>
    </Space>
  );
}

export default InterviewerPage;
