'use client'

import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '@/store/store'
import { setPage } from '@/store/slices/jobsSlice'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

export default function Pagination() {
  const dispatch = useDispatch()
  const { pagination } = useSelector((state: RootState) => state.jobs)

  const { page, pages, total, per_page } = pagination

  if (pages <= 1) return null

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pages) {
      dispatch(setPage(newPage))
    }
  }

  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, page - delta); i <= Math.min(pages - 1, page + delta); i++) {
      range.push(i)
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (page + delta < pages - 1) {
      rangeWithDots.push('...', pages)
    } else if (pages > 1) {
      rangeWithDots.push(pages)
    }

    return rangeWithDots
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 animate-slide-up">
      <div className="text-sm text-muted-foreground">
        Showing {((page - 1) * per_page) + 1} to {Math.min(page * per_page, total)} of {total} jobs
      </div>
      
      <div className="flex items-center gap-2">
        {/* First Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(1)}
          disabled={page === 1}
          className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-all duration-300"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-all duration-300"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {getVisiblePages().map((pageNum, index) => (
            pageNum === '...' ? (
              <span key={index} className="px-3 py-2 text-muted-foreground">
                ...
              </span>
            ) : (
              <Button
                key={index}
                variant={pageNum === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(pageNum as number)}
                className={
                  pageNum === page
                    ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-black hover:from-yellow-300 hover:to-orange-300"
                    : "border-yellow-400/30 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-all duration-300"
                }
              >
                {pageNum}
              </Button>
            )
          ))}
        </div>

        {/* Next Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page + 1)}
          disabled={page === pages}
          className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-all duration-300"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(pages)}
          disabled={page === pages}
          className="border-yellow-400/30 text-yellow-400 hover:bg-yellow-400 hover:text-black transition-all duration-300"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Per Page Selector */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Show:</span>
        <Select
          value={per_page.toString()}
          onValueChange={(value) => {
            // We'll implement this when needed
          }}
        >
          <SelectTrigger className="w-20 bg-secondary/50 border-yellow-400/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
