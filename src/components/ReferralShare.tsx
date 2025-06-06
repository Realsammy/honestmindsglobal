import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Copy, Check, Facebook, Twitter, MessageCircle, Linkedin } from 'lucide-react';
import Button from './ui/Button';
import { useNotification } from '../hooks/useNotification.tsx';

interface ReferralShareProps {
  referralId: string;
  referralCount: number;
}

const ReferralShare: React.FC<ReferralShareProps> = ({ referralId, referralCount }) => {
  const { showToast } = useNotification();
  const [copied, setCopied] = useState(false);
  
  const referralLink = `https://honestmindsglobal.com/register?ref=${referralId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      showToast('Referral link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      showToast('Failed to copy referral link', 'error');
    }
  };

  const shareToSocial = (platform: string) => {
    const text = `Join Honest Minds Global Ventures and start your journey to financial freedom! Use my referral link: ${referralLink}`;
    let url = '';

    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodeURIComponent(text)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`;
        break;
    }

    window.open(url, '_blank', 'width=600,height=400');
  };

  const shareReferral = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Honest Minds',
          text: 'Join me on Honest Minds and start saving together!',
          url: referralLink,
        });
        showToast('Referral link shared successfully!', 'success');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          showToast('Failed to share referral link', 'error');
        }
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm p-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Refer Friends</h2>
        <p className="text-gray-600">Share your referral link and earn bonuses!</p>
        <div className="mt-4">
          <span className="text-3xl font-bold text-primary-600">{referralCount}</span>
          <p className="text-gray-600">People you've referred</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={copyToClipboard}
            leftIcon={copied ? <Check size={16} /> : <Copy size={16} />}
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>

        <div className="flex justify-center space-x-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => shareToSocial('facebook')}
            leftIcon={<Facebook size={16} />}
          >
            Facebook
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => shareToSocial('twitter')}
            leftIcon={<Twitter size={16} />}
          >
            Twitter
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => shareToSocial('whatsapp')}
            leftIcon={<MessageCircle size={16} />}
          >
            WhatsApp
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => shareToSocial('linkedin')}
            leftIcon={<Linkedin size={16} />}
          >
            LinkedIn
          </Button>
        </div>

        <Button
          onClick={shareReferral}
          leftIcon={<Share2 size={16} />}
          className="w-full"
        >
          Share Referral Link
        </Button>
      </div>
    </motion.div>
  );
};

export default ReferralShare;
