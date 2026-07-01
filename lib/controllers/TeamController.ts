import { NextResponse } from 'next/server';
import { TeamService } from '../services/TeamService';

export class TeamController {
  static async getAll() {
    try {
      const data = await TeamService.getAllTeams();
      return NextResponse.json(data);
    } catch (err: any) {
      console.error('Error fetching teams:', err);
      return NextResponse.json({ error: err.message || 'Gagal mengambil data tim.' }, { status: 500 });
    }
  }

  static async create(request: Request) {
    try {
      const body = await request.json();
      const data = await TeamService.createTeam(body);
      return NextResponse.json(data);
    } catch (err: any) {
      console.error('Error creating team:', err);
      return NextResponse.json({ error: err.message || 'Gagal menambahkan tim.' }, { status: 400 });
    }
  }

  static async update(request: Request, id: string) {
    try {
      const body = await request.json();
      const data = await TeamService.updateTeam(id, body);
      return NextResponse.json(data);
    } catch (err: any) {
      console.error('Error updating team:', err);
      return NextResponse.json({ error: err.message || 'Gagal mengubah data tim.' }, { status: 400 });
    }
  }

  static async delete(request: Request, id: string) {
    try {
      await TeamService.deleteTeam(id);
      return NextResponse.json({ success: true });
    } catch (err: any) {
      console.error('Error deleting team:', err);
      return NextResponse.json({ error: err.message || 'Gagal menghapus tim.' }, { status: 400 });
    }
  }
}
