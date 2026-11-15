// ブラウザ用に同梱する Anthropic 公式 SDK の入口（npm run vendor で js/vendor/anthropic.js を生成）
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';

export { Anthropic, betaZodOutputFormat, z };
