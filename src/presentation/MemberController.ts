import type { Request, Response } from 'express';
import type { IMemberService } from '../business/MemberService.js';

export class MemberController {
  constructor(private memberService: IMemberService) {}

  // POST /api/members - Create new member (for web forms)
  createMemberFromForm = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.memberService.createMember(req.body);
      if (result.success) {
        res.redirect('/members');
      } else {
        res.status(400).render('error', {
          title: 'Error',
          error: 'Failed to create member',
          details: result.error || 'Unknown error',
        });
      }
    } catch (error) {
      console.error('Error creating member:', error);
      res.status(500).render('error', {
        title: 'Error',
        error: 'Failed to create member',
        details: 'Internal server error',
      });
    }
  };

  // PUT /api/members/:id - Update member (for web forms)
  updateMemberFromForm = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.memberService.updateMember(req.params.id, req.body);
      if (result.success) {
        res.redirect(`/members/${req.params.id}`);
      } else {
        res.status(400).render('error', {
          title: 'Error',
          error: 'Failed to update member',
          details: result.error || 'Unknown error',
        });
      }
    } catch (error) {
      console.error('Error updating member:', error);
      res.status(500).render('error', {
        title: 'Error',
        error: 'Failed to update member',
        details: 'Internal server error',
      });
    }
  };

  // DELETE /api/members/:id - Delete member (for web forms)
  deleteMemberFromForm = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.memberService.deleteMember(req.params.id);
      if (result.success) {
        res.redirect('/members');
      } else {
        res.status(400).render('error', {
          title: 'Error',
          error: 'Failed to delete member',
          details: result.error || 'Unknown error',
        });
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      res.status(500).render('error', {
        title: 'Error',
        error: 'Failed to delete member',
        details: 'Internal server error',
      });
    }
  };

  // JSON API methods for future API usage
  getAllMembers = async (_req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.memberService.getAllMembers();
      if (result.success) {
        res.json(result.data);
      } else {
        res.status(500).json({ error: result.error || 'Failed to fetch members' });
      }
    } catch (error) {
      console.error('Error getting all members:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  getMemberById = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.memberService.getMemberById(req.params.id);
      if (result.success && result.data) {
        res.json(result.data);
      } else {
        res.status(404).json({ error: result.error || 'Member not found' });
      }
    } catch (error) {
      console.error('Error getting member by ID:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  createMember = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.memberService.createMember(req.body);
      if (result.success) {
        res.status(201).json(result.data);
      } else {
        res.status(400).json({ error: result.error || 'Failed to create member' });
      }
    } catch (error) {
      console.error('Error creating member:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  updateMember = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.memberService.updateMember(req.params.id, req.body);
      if (result.success) {
        res.json(result.data);
      } else {
        res.status(400).json({ error: result.error || 'Failed to update member' });
      }
    } catch (error) {
      console.error('Error updating member:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  deleteMember = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.memberService.deleteMember(req.params.id);
      if (result.success) {
        res.status(204).send();
      } else {
        res.status(400).json({ error: result.error || 'Failed to delete member' });
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  searchMembers = async (req: Request, res: Response): Promise<void> => {
    try {
      const searchTerm = req.query.q as string;
      if (!searchTerm?.trim()) {
        res.status(400).json({ error: 'Search term is required' });
        return;
      }

      const result = await this.memberService.searchMembers(searchTerm);
      if (result.success) {
        res.json(result.data);
      } else {
        res.status(500).json({ error: result.error || 'Search failed' });
      }
    } catch (error) {
      console.error('Error searching members:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
