import { error } from '@sveltejs/kit';
import { supabase } from '../supabaseClient';

export async function GET() {
	const { data } = await supabase.from('lobby').select('*');
	return new Response(String(JSON.stringify(data)));
}
export async function POST(request) {
	console.log(request.request.body);
	// const { data } = await supabase.from('lobby').insert(request.body);
	return new Response(String(JSON.stringify('data')));
}
