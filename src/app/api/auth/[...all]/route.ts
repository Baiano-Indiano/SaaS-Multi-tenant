import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  console.log("--- Auth API Request ---");
  console.log(`URL: ${request.url}`);
  console.log(`Pathname: ${new URL(request.url).pathname}`);
  console.log(`Method: ${request.method}`);
  
  const res = await auth.handler(request);
  
  console.log(`Response Status: ${res.status}`);
  console.log("--- End Auth API Request ---");
  return res;
}

export async function POST(request: NextRequest) {
  return await auth.handler(request);
}
