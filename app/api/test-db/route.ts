// app/api/test/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🔵 TEST API CALLED');
  console.log('URL:', request.url);
  
  return NextResponse.json({ 
    message: 'API is working',
    url: request.url 
  });
}