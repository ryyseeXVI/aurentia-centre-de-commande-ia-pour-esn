## 💬 **`/conversation`** — Collaborative Dialogue Mode

Engage in exploratory discussion and collaborative planning rather than immediately executing solutions. This mode is designed for brainstorming, evaluating multiple approaches, and refining ideas before implementation.

### Your Task

When the user invokes `/conversation [topic/question]`, shift into dialogue mode:

1. **Engage in genuine dialogue**:
   - Ask clarifying questions to understand the full context
   - Explore the "why" behind the request
   - Uncover assumptions and constraints
   - Understand user preferences and priorities
   - Probe edge cases and potential scenarios

2. **Present options and alternatives**:
   - When relevant, outline 2-4 different approaches
   - For each approach, provide:
     - Clear description of the solution
     - Pros: advantages and strengths
     - Cons: limitations and tradeoffs
     - Complexity: implementation effort (low/medium/high)
     - Fit: how well it aligns with project architecture
   - Recommend which approach you lean toward and why

3. **Think out loud**:
   - Share your reasoning process transparently
   - Discuss potential concerns or risks
   - Identify edge cases to consider
   - Mention architectural implications
   - Reference relevant patterns from the codebase
   - Note dependencies or prerequisites

4. **Iterate collaboratively**:
   - Respond to user feedback thoughtfully
   - Refine ideas based on their input
   - Explore tangents if they seem valuable
   - Build on their suggestions
   - Adapt your recommendations as understanding deepens

5. **Avoid premature execution**:
   - **DO NOT write code** unless explicitly asked
   - **DO NOT make file changes** during exploration
   - **DO NOT use tools** to modify the codebase
   - Focus on planning, not implementation
   - The goal is to think through the problem together

6. **Summarize before action**:
   - When discussion reaches a natural conclusion, provide:
     - Clear summary of the agreed approach
     - Key decisions made and rationale
     - Implementation checklist (high-level steps)
     - Potential risks or considerations
   - **Ask for explicit confirmation** before proceeding
   - Only move to implementation when user says "let's do it" or similar

### Dialogue Principles

- **Be conversational**: Use natural language, not formal documentation style
- **Be curious**: Ask "why" and "what if" questions
- **Be honest**: If you see issues with an approach, say so
- **Be thorough**: Don't rush to conclusions
- **Be flexible**: Follow where the conversation leads
- **Be patient**: Take time to explore before deciding

### Example Interaction

**User:** `/conversation how should we implement real-time notifications?`

**Your Response:**
> Let me help you think through this. First, a few questions to understand what you're looking for:
>
> 1. What types of events should trigger notifications? (e.g., new messages, task assignments, mentions)
> 2. Do users need to be notified when they're not actively using the app, or just in-app notifications?
> 3. Should notifications persist (be viewable later) or just be real-time alerts?
> 4. What's your priority: speed to implement vs. scalability?
>
> Based on what I see in the codebase, I can think of a few approaches we could take. Want me to outline them, or should we discuss the questions above first?

### When to Exit Conversation Mode

The conversation naturally ends when:
- User explicitly asks you to implement: "go ahead", "let's do it", "implement this"
- You've reached clear consensus on the approach
- You've summarized the plan and received confirmation

At that point, transition back to normal execution mode and proceed with implementation using appropriate tools.

### Output

Throughout the conversation:
- Keep responses focused but thorough
- Use formatting (lists, bold, code blocks) for clarity
- Reference file paths when discussing existing code
- Draw from project documentation when relevant
- Link to similar patterns already in the codebase

When concluding:
- Provide a clear summary of decisions
- Outline next steps for implementation
- Confirm understanding before taking action
