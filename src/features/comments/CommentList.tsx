import { CommentItem } from './CommentItem'
import type { Comment } from '../../shared/types'

type CommentListProps = {
  comments: Comment[]
  onDelete?: (id: string) => void
}

export function CommentList({ comments, onDelete }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-muted">
        暂无评论，快来发表第一条评论吧
      </div>
    )
  }

  return (
    <div>
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} onDelete={onDelete} />
      ))}
    </div>
  )
}
