import { NextResponse } from 'next/server';
import { LeagueService } from '../services/LeagueService';

export class LeagueController {
  static async getAll() {
    try {
      const data = await LeagueService.getAllLeagues();
      return NextResponse.json(data);
    } catch (err: any) {
      console.error('Error fetching leagues:', err);
      return NextResponse.json({ error: err.message || 'Gagal mengambil data liga.' }, { status: 500 });
    }
  }

  static async create(request: Request) {
    try {
      const body = await request.json();
      const data = await LeagueService.createLeague(body);
      return NextResponse.json(data);
    } catch (err: any) {
      console.error('Error creating league:', err);
      return NextResponse.json({ error: err.message || 'Gagal menambahkan liga.' }, { status: 400 });
    }
  }

  static async update(request: Request, id: string) {
    try {
      const body = await request.json();
      const data = await LeagueService.updateLeague(id, body);
      return NextResponse.json(data);
    } catch (err: any) {
      console.error('Error updating league:', err);
      return NextResponse.json({ error: err.message || 'Gagal mengubah data liga.' }, { status: 400 });
    }
  }

  static async delete(request: Request, id: string) {
    try {
      await LeagueService.deleteLeague(id);
      return NextResponse.json({ success: true });
    } catch (err: any) {
      console.error('Error deleting league:', err);
      return NextResponse.json({ error: err.message || 'Gagal menghapus liga.' }, { status: 400 });
    }
  }
}
