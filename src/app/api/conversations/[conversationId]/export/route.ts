import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/conversations/[conversationId]/export
 * 
 * Export conversation as JSON or Markdown
 * Query params: format=json|markdown
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    // Get conversation details
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Get messages
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgError) {
      throw msgError;
    }

    if (format === 'markdown') {
      // Export as Markdown
      let markdown = `# ${conversation.title}\n\n`;
      markdown += `**Date**: ${new Date(conversation.created_at).toLocaleString()}\n\n`;
      markdown += `---\n\n`;

      messages?.forEach((msg) => {
        const role = msg.role === 'user' ? '👤 You' : '🤖 Assistant';
        markdown += `## ${role}\n\n`;
        markdown += `${msg.content}\n\n`;
        
        if (msg.sources && msg.sources.length > 0) {
          markdown += `**Sources:**\n`;
          msg.sources.forEach((source: any) => {
            markdown += `- ${source.metadata?.source || 'Unknown'} (${(source.similarity * 100).toFixed(0)}%)\n`;
          });
          markdown += `\n`;
        }
        
        markdown += `---\n\n`;
      });

      return new NextResponse(markdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="conversation-${conversationId}.md"`,
        },
      });
    } else {
      // Export as JSON
      const exportData = {
        conversation,
        messages,
        exportedAt: new Date().toISOString(),
      };

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="conversation-${conversationId}.json"`,
        },
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export conversation' },
      { status: 500 }
    );
  }
}
