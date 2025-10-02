

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  uploadAndParseResume, updateProfileField, validateProfile, selectCandidateProfile, selectIsProfileComplete, selectValidationErrors, selectIsUploading, selectUploadError, resetCandidate,
} from '../store/candidateSlice';
import {
  startInterview, updateCurrentAnswer, submitAnswer, autoSubmitAnswer, decrementTimer, resetInterview, resumeInterviewTimer, selectCurrentQuestion, selectCurrentAnswer, selectTimeRemaining, selectInterviewProgress, selectIsInterviewActive, selectIsInterviewComplete, selectAllAnswers, selectInterviewStatus, selectScores, selectTotalScore, selectMaxScore, selectSummary, selectScorePercentage, selectIsScoreCalculated, selectNeedsTimerResume, calculateScores,
} from '../store/interviewSlice';
import { addCompletedCandidate } from '../store/candidatesSlice';
import { saveFinalScore, selectCandidateScore } from '../store/candidateSlice';
import {
  Upload,
  Button,
  Form,
  Input,
  Modal,
  Alert,
  Spin,
  Card,
  Space,
  Typography,
  Tooltip,
  Progress,
  List,
  Badge,
  Divider,
  message,
  Collapse,
  Row,
  Col,
  Statistic,
  Tag,
  Empty,
  Descriptions,
} from 'antd';
import { UploadOutlined, ClockCircleOutlined, ExclamationCircleTwoTone } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Panel } = Collapse;


function IntervieweePage() {
  const dispatch = useDispatch();
  // Candidate/profile state
  const profile = useSelector(selectCandidateProfile);
  const isProfileComplete = useSelector(selectIsProfileComplete);
  const validationErrors = useSelector(selectValidationErrors);
  const isUploading = useSelector(selectIsUploading);
  const uploadError = useSelector(selectUploadError);
  // Interview state
  const currentQuestion = useSelector(selectCurrentQuestion);
  const currentAnswer = useSelector(selectCurrentAnswer);
  const timeRemaining = useSelector(selectTimeRemaining);
  const interviewProgress = useSelector(selectInterviewProgress);
  const isInterviewActive = useSelector(selectIsInterviewActive);
  const isInterviewComplete = useSelector(selectIsInterviewComplete);
  const allAnswers = useSelector(selectAllAnswers);
  const interviewStatus = useSelector(selectInterviewStatus);
  // Score state
  const scores = useSelector(selectScores);
  const totalScore = useSelector(selectTotalScore);
  const maxScore = useSelector(selectMaxScore);
  const summary = useSelector(selectSummary);
  const scorePercentage = useSelector(selectScorePercentage);
  const isScoreCalculated = useSelector(selectIsScoreCalculated);

  const needsTimerResume = useSelector(selectNeedsTimerResume);
  // Resume timer after page reload
  useEffect(() => {
    if (needsTimerResume) {
      dispatch(resumeInterviewTimer());
    }
  }, [needsTimerResume, dispatch]);
  // UI state
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [profileStep, setProfileStep] = useState(0); // 0: name, 1: email, 2: phone
  const [viewMode, setViewMode] = useState('profile'); // 'profile' | 'interview' | 'complete'
  const timerRef = useRef();
  // Guard to prevent duplicate save
  const hasSavedToCollection = useRef(false);
  // Guard to prevent modal infinite loop
  const hasDismissedProfileModal = useRef(false);
  // Interview questions array for candidate record
  const interviewQuestions = useSelector(state => state.interview.questions);
  // Save completed candidate to collection when scores are calculated
  useEffect(() => {
    if (
      isScoreCalculated &&
      totalScore &&
      maxScore &&
      summary &&
      profile.id &&
      !hasSavedToCollection.current
    ) {
      const candidateObj = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        resumeFileName: profile.resumeFileName,
        uploadedAt: profile.uploadedAt,
        interviewCompletedAt: interviewStatus.completedAt,
        finalScore: totalScore,
        maxScore,
        scorePercentage,
        rating: summary.rating,
        recommendation: summary.recommendation,
        summary,
        questions: interviewQuestions,
        answers: allAnswers,
        scores,
      };
      dispatch(addCompletedCandidate(candidateObj));
      hasSavedToCollection.current = true;
      message.success('Your interview results have been saved!');
    }
  }, [isScoreCalculated, totalScore, maxScore, summary, scorePercentage, profile, interviewStatus.completedAt, interviewQuestions, allAnswers, scores, dispatch]);
  // Calculate scores when interview completes
  useEffect(() => {
    if (isInterviewComplete && !isScoreCalculated) {
      dispatch(calculateScores());
    }
  }, [isInterviewComplete, isScoreCalculated, dispatch]);

  // Save scores to candidate profile when calculated
  useEffect(() => {
    if (isScoreCalculated && totalScore && maxScore && summary) {
      dispatch(saveFinalScore({
        finalScore: totalScore,
        maxScore,
        scorePercentage,
        summary,
        completedAt: interviewStatus.completedAt,
      }));
    }
  }, [isScoreCalculated, totalScore, maxScore, summary, scorePercentage, interviewStatus.completedAt, dispatch]);

  // Open modal if profile is incomplete and resume is uploaded, but only if not already open and not dismissed
  useEffect(() => {
    if (
      profile.resumeFileName &&
      !isProfileComplete &&
      !modalOpen &&
      !hasDismissedProfileModal.current
    ) {
      setModalOpen(true);
      setProfileStep(0);
      form.setFieldsValue({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
      });
    }
  }, [profile.resumeFileName, isProfileComplete, modalOpen, form, profile.name, profile.email, profile.phone]);

  // Interview timer effect
  useEffect(() => {
    if (isInterviewActive) {
      timerRef.current = setInterval(() => {
        dispatch(decrementTimer());
      }, 1000);
      return () => clearInterval(timerRef.current);
    } else {
      clearInterval(timerRef.current);
    }
  }, [isInterviewActive, dispatch]);

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (isInterviewActive && timeRemaining === 0) {
      dispatch(autoSubmitAnswer());
      message.warning('Time up! Answer auto-submitted.');
    }
  }, [isInterviewActive, timeRemaining, dispatch]);

  // Switch to interview view when started
  useEffect(() => {
    if (isInterviewActive) setViewMode('interview');
    if (isInterviewComplete) setViewMode('complete');
    if (!isInterviewActive && !isInterviewComplete) setViewMode('profile');
  }, [isInterviewActive, isInterviewComplete]);

  // Resume upload handler
  const beforeUpload = file => {
    const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isDOCX = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx');
    if (!isPDF && !isDOCX) {
      dispatch({ type: 'candidate/setUploadError', payload: 'Only PDF or DOCX files are allowed.' });
      return Upload.LIST_IGNORE;
    }
    
    // Show loading state
    dispatch({ type: 'candidate/setIsUploading', payload: true });
    dispatch({ type: 'candidate/setUploadError', payload: null });
    
    dispatch(uploadAndParseResume(file)).then(() => {
      dispatch(validateProfile());
    }).catch((error) => {
      console.error('Upload error:', error);
      dispatch({ type: 'candidate/setUploadError', payload: 'Failed to process file. Please try again or use a different file.' });
    });
    return false; // Prevent auto-upload
  };

  // Modal form submit

  const handleProfileStepNext = async () => {
    try {
      if (profileStep === 0) {
        // Validate name
        await form.validateFields(['name']);
        const name = form.getFieldValue('name');
        if (name !== profile.name) dispatch(updateProfileField({ field: 'name', value: name }));
        setProfileStep(1);
      } else if (profileStep === 1) {
        // Validate email
        await form.validateFields(['email']);
        const email = form.getFieldValue('email');
        if (email !== profile.email) dispatch(updateProfileField({ field: 'email', value: email }));
        setProfileStep(2);
      } else if (profileStep === 2) {
        // Validate phone
        await form.validateFields(['phone']);
        const phone = form.getFieldValue('phone');
        if (phone !== profile.phone) dispatch(updateProfileField({ field: 'phone', value: phone }));
        dispatch(validateProfile());
        setModalOpen(false);
        hasDismissedProfileModal.current = true;
      }
    } catch (err) {
      // Validation errors handled by form
    }
  };

  // When user cancels modal, mark as dismissed so it doesn't reopen until new resume is uploaded
  const handleModalCancel = () => {
    setModalOpen(false);
    hasDismissedProfileModal.current = true;
    setProfileStep(0);
  };

  // Only show fields that are missing/invalid
  const missingFields = Object.keys(validationErrors);

  // Interview start handler
  const handleStartInterview = () => {
    dispatch(startInterview(profile.id));
    message.success('Interview started!');
  };

  // Submit answer handler
  const handleSubmitAnswer = () => {
    if (!currentAnswer) return;
    dispatch(submitAnswer());
    message.success('Answer submitted!');
  };

  // Start new interview handler
  const handleStartNew = () => {
    dispatch(resetInterview());
    dispatch(resetCandidate());
    setViewMode('profile');
    hasSavedToCollection.current = false;
    message.info('You can upload a new resume and start again.');
  };

  // Timer color
  const getTimerColor = () => {
    if (timeRemaining > 30) return 'green';
    if (timeRemaining > 10) return 'orange';
    return 'red';
  };

  // Main render
  if (viewMode === 'interview' && isInterviewActive && currentQuestion) {
    return (
      <Space direction="vertical" size="large" style={{ width: '100%', height: '100%', padding: '20px' }}>
        <Card style={{
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space align="center" style={{ width: '100%', justifyContent: 'space-between', padding: '0 8px' }}>
              <Badge 
                count={currentQuestion.difficulty} 
                style={{ 
                  backgroundColor: '#6366f1',
                  fontSize: '1rem',
                  fontWeight: '600',
                  padding: '4px 12px',
                  borderRadius: '20px'
                }} 
              />
              <Text style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.4rem)', fontWeight: '600', color: '#374151' }}>
                Question {interviewProgress.current} of {interviewProgress.total}
              </Text>
              <Space>
                <ClockCircleOutlined style={{ color: getTimerColor(), fontSize: 24 }} />
                <Text style={{ color: getTimerColor(), fontWeight: 700, fontSize: 'clamp(1.2rem, 2.5vw, 1.4rem)' }}>
                  {timeRemaining}s
                </Text>
                <Progress
                  percent={Math.round((timeRemaining / currentQuestion.timeLimit) * 100)}
                  size="small"
                  showInfo={false}
                  strokeColor={getTimerColor()}
                  style={{ width: 80 }}
                />
              </Space>
            </Space>
            <Divider style={{ margin: '24px 0' }} />
            <Text strong style={{ 
              fontSize: 'clamp(1.3rem, 3vw, 1.6rem)', 
              lineHeight: '1.6',
              color: '#1f2937',
              marginBottom: '24px'
            }}>
              {currentQuestion.question}
            </Text>
            <Input.TextArea
              rows={8}
              value={currentAnswer}
              onChange={e => dispatch(updateCurrentAnswer(e.target.value))}
              disabled={timeRemaining === 0}
              placeholder="Type your answer here..."
              style={{ 
                marginTop: 16,
                fontSize: '1.1rem',
                borderRadius: '12px',
                border: '2px solid #e5e7eb',
                padding: '16px',
                resize: 'vertical',
                minHeight: '200px'
              }}
              autoFocus
            />
            <Space style={{ width: '100%', justifyContent: 'flex-end', marginTop: '24px' }}>
              <Button
                type="primary"
                size="large"
                onClick={handleSubmitAnswer}
                disabled={!currentAnswer || timeRemaining === 0}
                style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  height: '48px',
                  padding: '0 32px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                }}
              >
                ✅ Submit Answer
              </Button>
            </Space>
            {timeRemaining <= 10 && timeRemaining > 0 && (
              <Alert 
                type="warning" 
                message={`⏰ Time running out! Auto-submit in ${timeRemaining}s`} 
                showIcon 
                style={{ fontSize: '1.1rem', borderRadius: '8px' }}
              />
            )}
          </Space>
        </Card>
        <Collapse style={{ width: '100%' }}>
          <Panel header="Previous Questions & Answers" key="1">
            <List
              dataSource={allAnswers}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    title={<span><Badge count={item.difficulty} style={{ backgroundColor: '#1890ff' }} /> {item.question}</span>}
                    description={<span><b>Answer:</b> {item.answer || <Text type="secondary">(No answer)</Text>} <br /><b>Time Spent:</b> {item.timeSpent}s {item.autoSubmitted && <ExclamationCircleTwoTone twoToneColor="#faad14" title="Auto-submitted" />}</span>}
                  />
                </List.Item>
              )}
            />
          </Panel>
        </Collapse>
      </Space>
    );
  }

  if (viewMode === 'complete' && isInterviewComplete) {
    // Loading state while scores are being calculated
    if (!isScoreCalculated) {
      return (
        <Space direction="vertical" size="large" style={{ width: '100%', maxWidth: 600, margin: '0 auto', marginTop: 40 }}>
          <Spin tip="Calculating your scores..." size="large" />
        </Space>
      );
    }
    // Error state
    if (!summary) {
      return (
        <Space direction="vertical" size="large" style={{ width: '100%', maxWidth: 600, margin: '0 auto', marginTop: 40 }}>
          <Alert type="error" message="Unable to calculate scores. Please try again." showIcon />
          <Button type="primary" style={{ marginTop: 24 }} onClick={handleStartNew}>
            Start New Interview
          </Button>
        </Space>
      );
    }
    // Score color
    const getScoreColor = pct => {
      if (pct >= 80) return 'green';
      if (pct >= 60) return 'blue';
      if (pct >= 40) return 'orange';
      return 'red';
    };
    const handleReturnHome = () => {
      dispatch(resetInterview());
      dispatch(resetCandidate());
      setViewMode('profile');
      hasSavedToCollection.current = false;
    };
    return (
      <Space direction="vertical" size="large" style={{ width: '100%', height: '100%', padding: '20px' }}>
        {/* Score Overview */}
        <Card>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Statistic title="Total Score" value={totalScore} suffix={`/ ${maxScore}`} />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Statistic title="Percentage" value={scorePercentage} suffix="%" />
            </Col>
            <Col xs={24} sm={24} md={8} style={{ textAlign: 'center' }}>
              <Progress
                type="circle"
                percent={scorePercentage}
                strokeColor={getScoreColor(scorePercentage)}
                width={80}
                format={p => `${p}%`}
              />
              <div style={{ marginTop: 8 }}>
                <Tag color={getScoreColor(scorePercentage)} style={{ fontSize: 16 }}>{summary.rating}</Tag>
              </div>
            </Col>
          </Row>
          <Divider />
          <Text strong>Recommendation:</Text> {summary.recommendation}
        </Card>
        {/* AI Interview Summary */}
        <Card title="AI Interview Summary">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Text strong>Strengths:</Text>
              {summary.overallStrengths && summary.overallStrengths.length ? (
                <ul>
                  {summary.overallStrengths.map((s, i) => <li key={i}><Tag color="green">{s}</Tag></li>)}
                </ul>
              ) : <Empty description="No strengths detected" />}
            </Col>
            <Col xs={24} md={12}>
              <Text strong>Areas for Improvement:</Text>
              {summary.overallWeaknesses && summary.overallWeaknesses.length ? (
                <ul>
                  {summary.overallWeaknesses.map((w, i) => <li key={i}><Tag color="orange">{w}</Tag></li>)}
                </ul>
              ) : <Empty description="No weaknesses detected" />}
            </Col>
          </Row>
          <Divider />
          <Text strong>Time Management:</Text> {summary.timeManagement}
        </Card>
        {/* Category Breakdown */}
        <Card title="Performance by Category">
          <Descriptions bordered column={1} size="small">
            {summary.categoryBreakdown && summary.categoryBreakdown.length ? summary.categoryBreakdown.map((cat) => (
              <Descriptions.Item key={cat.category} label={cat.category}>
                <Progress percent={Math.round((cat.avgScore / (cat.category === 'Hard' ? 20 : cat.category === 'Medium' ? 15 : 10)) * 100)} size="small" status="active" />
                <span style={{ marginLeft: 8 }}>Avg Score: {cat.avgScore}</span>
              </Descriptions.Item>
            )) : <Descriptions.Item>No category data</Descriptions.Item>}
          </Descriptions>
        </Card>
        {/* Question-by-Question Breakdown */}
        <Card title="Question-by-Question Breakdown">
          <Collapse accordion>
            {allAnswers.map((ans, i) => (
              <Panel
                header={<span>Q{i + 1}: <Badge count={ans.difficulty} style={{ backgroundColor: '#1890ff' }} /> <span style={{ marginLeft: 8 }}>{scores[i]?.score || 0}/10</span></span>}
                key={i}
              >
                <Text strong>Question:</Text> {ans.question}<br />
                <Text strong>Your Answer:</Text>
                <div style={{ background: '#f6f6f6', padding: 8, borderRadius: 4, margin: '8px 0' }}><Text code>{ans.answer || '(No answer)'}</Text></div>
                <Text strong>AI Feedback:</Text> {scores[i]?.feedback}<br />
                <Text strong>Strengths:</Text> {scores[i]?.strengths && scores[i].strengths.length ? scores[i].strengths.map((s, j) => <Tag color="green" key={j}>{s}</Tag>) : <Text type="secondary">None</Text>}<br />
                <Text strong>Improvements:</Text> {scores[i]?.improvements && scores[i].improvements.length ? scores[i].improvements.map((w, j) => <Tag color="orange" key={j}>{w}</Tag>) : <Text type="secondary">None</Text>}<br />
                <Text strong>Time Spent:</Text> {ans.timeSpent}s / {ans.difficulty === 'Hard' ? 120 : ans.difficulty === 'Medium' ? 60 : 20}s {ans.autoSubmitted && <ExclamationCircleTwoTone twoToneColor="#faad14" title="Auto-submitted" />}<br />
              </Panel>
            ))}
          </Collapse>
        </Card>
        <Button type="primary" style={{ marginTop: 24 }} onClick={handleReturnHome}>
          Return to Home
        </Button>
      </Space>
    );
  }

  // Default: profile/upload UI
  return (
    <Space direction="vertical" size="large" style={{ width: '100%', height: '100%', padding: '20px' }}>
      <Title level={2} style={{ 
        textAlign: 'center',
        fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: '32px'
      }}>
        📄 Upload Your Resume
      </Title>
      <Upload.Dragger
        name="resume"
        accept=".pdf,.docx"
        beforeUpload={beforeUpload}
        showUploadList={false}
        disabled={isUploading}
        style={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          border: '2px dashed #cbd5e1',
          borderRadius: '16px',
          padding: '60px 40px',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <p className="ant-upload-drag-icon">
          <UploadOutlined style={{ fontSize: 48, color: '#6366f1' }} />
        </p>
        <p className="ant-upload-text" style={{ 
          fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
          fontWeight: '600',
          color: '#374151',
          margin: '16px 0 8px 0'
        }}>
          Click or drag PDF/DOCX file to this area to upload
        </p>
        <p className="ant-upload-hint" style={{ 
          fontSize: 'clamp(1rem, 2vw, 1.2rem)',
          color: '#6b7280'
        }}>
          PDF or DOCX files accepted. Max 5MB. If PDF fails, try DOCX format.
        </p>
      </Upload.Dragger>
      {isUploading && <Spin tip="Parsing resume..." />}
      {uploadError && <Alert type="error" message={uploadError} showIcon />}
      {profile.resumeFileName && (
        <Card 
          title={<span style={{ fontSize: '1.3rem', fontWeight: '600' }}>👤 Extracted Profile</span>} 
          size="default"
          style={{
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)' }}>
              <Text style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)', fontWeight: '600' }}>Name:</Text> 
              <span style={{ marginLeft: '8px', fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)' }}>
                {profile.name || <Text type="danger" style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)' }}>Missing</Text>}
              </span>
            </div>
            <div style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)' }}>
              <Text style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)', fontWeight: '600' }}>Email:</Text> 
              <span style={{ marginLeft: '8px', fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)' }}>
                {profile.email || <Text type="danger" style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)' }}>Missing</Text>}
              </span>
            </div>
            <div style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)' }}>
              <Text style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)', fontWeight: '600' }}>Phone:</Text> 
              <span style={{ marginLeft: '8px', fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)' }}>
                {profile.phone || <Text type="danger" style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)' }}>Missing</Text>}
              </span>
            </div>
            <div style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)' }}>
              <Text style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)', fontWeight: '600' }}>Resume:</Text> 
              <span style={{ marginLeft: '8px', fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)' }}>{profile.resumeFileName}</span>
            </div>
            {!isProfileComplete && (
              <Alert
                type="warning"
                message="Some required fields are missing or invalid. Please complete your profile."
                showIcon
                style={{ fontSize: '1rem' }}
              />
            )}
          </Space>
        </Card>
      )}
      <Tooltip
        title={isProfileComplete ? '' : 'Please complete your profile before starting the interview.'}
        placement="top"
      >
        <Button
          type="primary"
          size="large"
          disabled={!isProfileComplete}
          style={{ 
            width: '100%',
            height: 'clamp(56px, 8vw, 72px)',
            fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)',
            fontWeight: '600',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.3s ease'
          }}
          onClick={handleStartInterview}
        >
          🚀 Start Interview
        </Button>
      </Tooltip>
      <Modal
        title={<span style={{ fontSize: '1.4rem', fontWeight: '600' }}>✏️ Complete Your Profile</span>}
        open={modalOpen}
        onOk={handleProfileStepNext}
        onCancel={handleModalCancel}
        okText={profileStep === 2 ? 'Save' : 'Next'}
        cancelText="Cancel"
        destroyOnClose
        maskClosable={false}
        style={{ fontSize: '1.1rem' }}
        okButtonProps={{
          style: {
            fontSize: '1.1rem',
            height: '40px',
            borderRadius: '8px',
            fontWeight: '600'
          }
        }}
        cancelButtonProps={{
          style: {
            fontSize: '1.1rem',
            height: '40px',
            borderRadius: '8px',
            fontWeight: '600'
          }
        }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: profile.name || '',
            email: profile.email || '',
            phone: profile.phone || '',
          }}
        >
          {profileStep === 0 && (
            <Form.Item
              label={<span style={{ fontSize: '1.1rem', fontWeight: '600' }}>Name</span>}
              name="name"
              rules={[{ required: true, message: 'Please enter your name.' }]}
            >
              <Input 
                placeholder="Full Name" 
                size="large"
                style={{ fontSize: '1.1rem', height: '48px', borderRadius: '8px' }}
                autoFocus
              />
            </Form.Item>
          )}
          {profileStep === 1 && (
            <Form.Item
              label={<span style={{ fontSize: '1.1rem', fontWeight: '600' }}>Email</span>}
              name="email"
              rules={[
                { required: true, message: 'Please enter your email.' },
                { type: 'email', message: 'Please enter a valid email.' },
              ]}
            >
              <Input 
                placeholder="Email" 
                size="large"
                style={{ fontSize: '1.1rem', height: '48px', borderRadius: '8px' }}
                autoFocus
              />
            </Form.Item>
          )}
          {profileStep === 2 && (
            <Form.Item
              label={<span style={{ fontSize: '1.1rem', fontWeight: '600' }}>Phone</span>}
              name="phone"
              rules={[
                { required: true, message: 'Please enter your phone number.' },
                { pattern: /^\+?\d[\d\s()-]{8,}\d$/, message: 'Please enter a valid phone number.' },
              ]}
            >
              <Input 
                placeholder="Phone Number" 
                size="large"
                style={{ fontSize: '1.1rem', height: '48px', borderRadius: '8px' }}
                autoFocus
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </Space>
  );
}

export default IntervieweePage;
