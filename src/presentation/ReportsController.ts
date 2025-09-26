import type { Request, Response } from 'express';
import type { ReportsService } from '../business/ReportsService.js';
import type { 
  PopularBooksResponse, 
  ReportsFilters,
  ErrorResponse 
} from '../shared/types.js';

export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  /**
   * Get most popular books report
   */
  getPopularBooks = async (req: Request, res: Response<PopularBooksResponse | ErrorResponse>) => {
    try {
      const filters: ReportsFilters = {
        period: (req.query.period as ReportsFilters['period']) || 'all-time',
        limit: req.query.limit ? Number(req.query.limit) : 20,
        genre: req.query.genre as string,
        min_borrows: req.query.min_borrows ? Number(req.query.min_borrows) : 1,
      };

      const result = await this.reportsService.getPopularBooks(filters);

      if (!result.success) {
        return res.status(result.statusCode || 500).json({
          error: result.error || 'Failed to generate popular books report',
          details: 'Unable to retrieve borrowing statistics',
        });
      }

      const response: PopularBooksResponse = {
        books: result.data?.books || [],
        total: result.data?.total || 0,
        period: filters.period,
        generated_at: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getPopularBooks:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'Failed to process popular books request',
      });
    }
  };

  /**
   * Get popular books report with additional statistics
   */
  getPopularBooksWithStats = async (req: Request, res: Response) => {
    try {
      const filters: ReportsFilters = {
        period: (req.query.period as ReportsFilters['period']) || 'all-time',
        limit: req.query.limit ? Number(req.query.limit) : 20,
        genre: req.query.genre as string,
        min_borrows: req.query.min_borrows ? Number(req.query.min_borrows) : 1,
      };

      const result = await this.reportsService.getPopularBooksWithStats(filters);

      if (!result.success) {
        return res.status(result.statusCode || 500).json({
          error: result.error || 'Failed to generate detailed popular books report',
          details: 'Unable to retrieve comprehensive borrowing statistics',
        });
      }

      res.json(result.data);
    } catch (error) {
      console.error('Error in getPopularBooksWithStats:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: 'Failed to process detailed popular books request',
      });
    }
  };
}