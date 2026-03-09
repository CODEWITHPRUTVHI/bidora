import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { SocialService } from '../services/socialService';

export const followUser = async (req: AuthRequest, res: Response) => {
    try {
        const { id: followingId } = req.params;
        const followerId = req.user!.id;

        const follow = await SocialService.followUser(followerId, followingId);
        return res.status(201).json({ success: true, follow });
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
};

export const unfollowUser = async (req: AuthRequest, res: Response) => {
    try {
        const { id: followingId } = req.params;
        const followerId = req.user!.id;

        await SocialService.unfollowUser(followerId, followingId);
        return res.status(200).json({ success: true, message: 'Unfollowed' });
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
};

export const getHypeFeed = async (req: AuthRequest, res: Response) => {
    try {
        const feed = await SocialService.getHypeFeed();
        return res.status(200).json({ feed });
    } catch (error: any) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const checkFollowingStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id: followingId } = req.params;
        const followerId = req.user!.id;

        const isFollowing = await SocialService.isFollowing(followerId, followingId);
        return res.status(200).json({ isFollowing });
    } catch (error: any) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const requestingUserId = req.user?.id;
        const profile = await SocialService.getUserProfile(id, requestingUserId);
        return res.status(200).json({ profile });
    } catch (error: any) {
        if (error.message === 'User not found') return res.status(404).json({ error: error.message });
        return res.status(500).json({ error: 'Internal server error' });
    }
};
