import { error } from '@sveltejs/kit';
import { supabase } from '../supabaseClient';

export async function GET() {
	const { data } = await supabase.from('countries').select('*');

	return new Response(String(JSON.stringify(data)));
}
