import re

# Read the file
with open(r'F:\Scarpper\job-portal-frontend\src\store\slices\socialSlice.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix all token references
content = re.sub(r"'Authorization': `Bearer \$\{auth\.token\}`", "'Authorization': `Bearer ${auth.tokens.access_token}`", content)

# Fix error types
content = re.sub(r'} catch \(error: any\) \{', '} catch (error: unknown) {', content)
content = re.sub(r'return rejectWithValue\(error\.message\);', 'return rejectWithValue((error as Error).message);', content)

# Fix unused parameters
content = re.sub(r'updateBlogLikeCount: \(state, action: PayloadAction<\{ blogId: number; increment: boolean \}>\) => \{', 'updateBlogLikeCount: (state, _action: PayloadAction<{ blogId: number; increment: boolean }>) => {', content)
content = re.sub(r'updateCommentLikeCount: \(state, action: PayloadAction<\{ commentId: number; increment: boolean \}>\) => \{', 'updateCommentLikeCount: (state, _action: PayloadAction<{ commentId: number; increment: boolean }>) => {', content)

# Write back
with open(r'F:\Scarpper\job-portal-frontend\src\store\slices\socialSlice.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed token references and error types in socialSlice.ts")
