'use client'

import { Box, Button, Icon, Stack, Text } from '@chakra-ui/react'
import { useState } from 'react'
import { MdMic, MdStop } from 'react-icons/md'
import { useMediaRecorder } from './hooks/useMediaRecorder'

// アニメーション用のキーフレーム
const pulseAnimation = `
  @keyframes pulse {
    0% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.1); opacity: 1; }
    100% { transform: scale(1); opacity: 0.8; }
  }
`

const fadeInAnimation = `
  @keyframes fadeIn {
    0% { opacity: 0; transform: scale(0.9); }
    100% { opacity: 1; transform: scale(1); }
  }
`

const spinAnimation = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

/**
 * 録音ボタンコンポーネント
 *
 * クリックで録音開始/停止を制御する
 */
export function RecordButton() {
  const [status, setStatus] = useState<
    'idle' | 'recording' | 'processing' | 'completed'
  >('idle')
  const { startRecording, stopRecording, isRecording } = useMediaRecorder()

  const handleClick = async () => {
    if (!isRecording) {
      setStatus('recording')
      await startRecording()
    } else {
      setStatus('processing')
      await stopRecording()
      setStatus('completed')
      setTimeout(() => setStatus('idle'), 2000) // 完了表示後、アイドル状態に戻す
    }
  }

  return (
    <Stack direction="column" align="center" gap={2}>
      <Box
        as="style"
        dangerouslySetInnerHTML={{
          __html: `${pulseAnimation} ${fadeInAnimation} ${spinAnimation}`,
        }}
      />
      <Button
        onClick={handleClick}
        width="140px"
        height="140px"
        borderRadius="full"
        backgroundColor={
          status === 'recording'
            ? 'rgba(255,0,0,0.8)'
            : status === 'completed'
              ? 'rgba(0,0,0,0.7)'
              : 'rgba(0,0,0,0.8)'
        }
        color="white"
        _hover={{
          bg: status === 'recording' ? 'rgba(255,0,0,0.9)' : 'rgba(0,0,0,0.9)',
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
        }}
        _active={{
          transform: 'translateY(0)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        }}
        animation={
          status === 'recording'
            ? 'pulse 2s infinite ease-in-out'
            : status === 'completed'
              ? 'fadeIn 0.5s ease-out'
              : undefined
        }
        transition="all 0.2s ease"
        backdropFilter="blur(10px)"
        boxShadow={
          status === 'recording'
            ? '0 0 30px rgba(255,0,0,0.3), 0 6px 16px rgba(0,0,0,0.3)'
            : '0 6px 16px rgba(0,0,0,0.3)'
        }
        aria-label="録音"
        disabled={status === 'processing'}
      >
        {status === 'processing' ? (
          <Box position="relative" width="40px" height="40px">
            <Box
              position="absolute"
              top="0"
              left="0"
              width="100%"
              height="100%"
              borderRadius="full"
              border="3px solid"
              borderColor="rgba(255,255,255,0.2)"
              borderTopColor="white"
              animation="spin 1s infinite linear"
            />
          </Box>
        ) : (
          <Box textAlign="center">
            <Icon
              as={status === 'recording' ? MdStop : MdMic}
              boxSize={12}
              mb={1}
            />
            <Text fontSize="16px" fontWeight="500">
              {status === 'recording'
                ? '録音中...'
                : status === 'completed'
                  ? '完了！'
                  : '録音する'}
            </Text>
          </Box>
        )}
      </Button>
    </Stack>
  )
}
