import { NextResponse } from 'next/server';
import { MatchService } from '../services/MatchService';

export class MatchController {
  static async getAll(request: Request) {
    try {
      // Sync matches status before loading list
      await MatchService.autoUpdateStatuses();

      const { searchParams } = new URL(request.url);
      const leagueId = searchParams.get('leagueId') || undefined;
      const status = searchParams.get('status') || undefined;
      const date = searchParams.get('date') || undefined;
      const search = searchParams.get('search') || undefined;
      const isHotParam = searchParams.get('isHot');
      const isHot = isHotParam === 'true' ? true : isHotParam === 'false' ? false : undefined;

      const data = await MatchService.getAllMatches({
        leagueId,
        status,
        date,
        isHot,
        search,
      });

      return NextResponse.json(data);
    } catch (err: any) {
      console.error('Error fetching matches:', err);
      return NextResponse.json({ error: err.message || 'Gagal mengambil data pertandingan.' }, { status: 500 });
    }
  }

  static async create(request: Request) {
    try {
      const body = await request.json();
      const data = await MatchService.createMatch(body);
      return NextResponse.json(data);
    } catch (err: any) {
      console.error('Error creating match:', err);
      return NextResponse.json({ error: err.message || 'Gagal membuat pertandingan.' }, { status: 400 });
    }
  }

  static async update(request: Request, id: string) {
    try {
      const body = await request.json();
      
      // Check if it's a quick patch/update for hot, featured, or status fields
      if (body.status !== undefined && Object.keys(body).length === 1) {
        const data = await MatchService.updateMatchStatus(id, body.status);
        return NextResponse.json(data);
      }
      if (body.isFeatured !== undefined && Object.keys(body).length === 1) {
        const data = await MatchService.updateMatchFeatured(id, body.isFeatured);
        return NextResponse.json(data);
      }
      if (body.isHot !== undefined && Object.keys(body).length === 1) {
        const data = await MatchService.updateMatchHot(id, body.isHot);
        return NextResponse.json(data);
      }

      const data = await MatchService.updateMatch(id, body);
      return NextResponse.json(data);
    } catch (err: any) {
      console.error('Error updating match:', err);
      return NextResponse.json({ error: err.message || 'Gagal mengubah pertandingan.' }, { status: 400 });
    }
  }

  static async delete(request: Request, id: string) {
    try {
      await MatchService.deleteMatch(id);
      return NextResponse.json({ success: true });
    } catch (err: any) {
      console.error('Error deleting match:', err);
      return NextResponse.json({ error: err.message || 'Gagal menghapus pertandingan.' }, { status: 400 });
    }
  }
}
