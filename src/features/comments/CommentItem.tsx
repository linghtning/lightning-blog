import { Trash2 } from "lucide-react";
import { formatRelativeTime } from "../../shared/time";
import type { Comment } from "../../shared/types";

type CommentItemProps = {
  comment: Comment;
  onDelete?: (id: string) => void;
};

export function CommentItem({ comment, onDelete }: CommentItemProps) {
  return (
    <div className="py-4 border-b border-border last:border-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted">{comment.authorId}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">
            {formatRelativeTime(comment.createdAt)}
          </span>
          {onDelete && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-muted hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <p className="text-foreground whitespace-pre-wrap">{comment.content}</p>
    </div>
  );
}
