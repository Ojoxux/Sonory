'use client'

import { SettingsIcon } from '@chakra-ui/icons'
import { Box, IconButton, Stack, Text } from '@chakra-ui/react'
import { RecordButton } from '../RecordButton'

// シンプルなアニメーション用のキーフレーム
const animations = `
  @keyframes fadeInUp {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeInLeft {
    0% {
      opacity: 0;
      transform: translateX(-20px);
    }
    100% {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes fadeInRight {
    0% {
      opacity: 0;
      transform: translateX(20px);
    }
    100% {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes gentleFloat {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-2px);
    }
  }
`

/**
 * マップ上に表示するUIオーバーレイコンポーネント
 *
 * アプリタイトル、設定ボタン、録音ボタンを含む
 */
export function UIOverlay() {
  return (
    <>
      {/* アニメーション定義 */}
      <Box
        as="style"
        dangerouslySetInnerHTML={{
          __html: animations,
        }}
      />

      {/* アプリタイトル */}
      <Box
        position="absolute"
        top="50px"
        left="24px"
        zIndex="100"
        pointerEvents="auto"
        background="rgba(255, 255, 255, 0.9)"
        backdropFilter="blur(10px)"
        padding="12px 20px"
        borderRadius="12px"
        animation="fadeInLeft 0.6s ease-out"
        transition="all 0.2s ease"
        _hover={{
          background: 'rgba(255, 255, 255, 0.95)',
          transform: 'translateY(-1px)',
        }}
      >
        <Text
          fontSize="24px"
          fontWeight="600"
          color="gray.800"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="0.3px"
        >
          Sonory
        </Text>
      </Box>

      {/* 設定ボタン */}
      <Box
        position="absolute"
        top="50px"
        right="24px"
        zIndex="100"
        pointerEvents="auto"
        animation="fadeInRight 0.6s ease-out"
      >
        <IconButton
          aria-label="設定"
          bg="rgba(255, 255, 255, 0.9)"
          color="gray.700"
          borderRadius="full"
          size="lg"
          width="48px"
          height="48px"
          backdropFilter="blur(10px)"
          transition="all 0.2s ease"
          _hover={{
            bg: 'rgba(255, 255, 255, 0.95)',
            transform: 'translateY(-1px) scale(1.05)',
            color: 'gray.800',
          }}
          _active={{
            transform: 'translateY(0) scale(1.02)',
          }}
        >
          <SettingsIcon boxSize={5} />
        </IconButton>
      </Box>

      {/* 録音ボタンエリア */}
      <Stack
        position="absolute"
        bottom="80px"
        left="0"
        right="0"
        margin="0 auto"
        zIndex="100"
        direction="column"
        align="center"
        gap={4}
        pointerEvents="auto"
        animation="fadeInUp 0.8s ease-out"
      >
        <RecordButton />

        {/* シンプルなインジケーター */}
        <Box
          width="40px"
          height="2px"
          borderRadius="full"
          background="rgba(255, 255, 255, 0.6)"
          animation="gentleFloat 3s ease-in-out infinite"
        />
      </Stack>
    </>
  )
}
