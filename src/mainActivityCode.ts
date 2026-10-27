export const MAIN_ACTIVITY_KOTLIN_CODE = `package com.inovi.tasktracker

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import java.util.Locale

// ==========================================
// DATA MODELS & ENUMS
// ==========================================

enum class TimerMode(val title: String, val defaultMinutes: Int) {
    FOCUS("Focus", 25),
    SHORT_BREAK("Short Break", 5),
    LONG_BREAK("Long Break", 15)
}

data class TaskItem(
    val id: Long,
    val text: String,
    val isCompleted: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)

// ==========================================
// MAIN ACTIVITY
// ==========================================

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            // Standard MaterialTheme wrapping without referencing any project-specific theme
            MaterialTheme(
                colorScheme = darkColorScheme(
                    primary = Color(0xFFE0533C),
                    background = Color(0xFF121417),
                    surface = Color(0xFF1B1E24),
                    surfaceVariant = Color(0xFF262A33),
                    onBackground = Color(0xFFE2E3E8),
                    onSurface = Color(0xFFE2E3E8),
                    onSurfaceVariant = Color(0xFFC4C6D0),
                    outline = Color(0xFF454B58)
                )
            ) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    FocusFlowApp()
                }
            }
        }
    }
}

// ==========================================
// COLOR PALETTE CONSTANTS
// ==========================================

private val ModeFocusColor = Color(0xFFE0533C)       // Energetic Coral / Terracotta
private val ModeShortBreakColor = Color(0xFF10B981)   // Emerald Green
private val ModeLongBreakColor = Color(0xFF3B82F6)    // Sky Blue

// ==========================================
// MAIN SCREEN COMPOSABLE
// ==========================================

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FocusFlowApp() {
    // Timer state management
    var currentMode by rememberSaveable { mutableStateOf(TimerMode.FOCUS) }
    var totalSeconds by rememberSaveable { mutableIntStateOf(TimerMode.FOCUS.defaultMinutes * 60) }
    var timeLeftSeconds by rememberSaveable { mutableIntStateOf(TimerMode.FOCUS.defaultMinutes * 60) }
    var isRunning by rememberSaveable { mutableStateOf(false) }
    var completedSessionsToday by rememberSaveable { mutableIntStateOf(0) }

    // Task list state management
    val tasks = remember {
        mutableStateListOf(
            TaskItem(id = 1L, text = "Plan today's deep work milestones", isCompleted = true),
            TaskItem(id = 2L, text = "Implement core business logic & verify tests", isCompleted = false),
            TaskItem(id = 3L, text = "Review pull requests & document API changes", isCompleted = false)
        )
    }
    var newTaskText by rememberSaveable { mutableStateOf("") }

    val keyboardController = LocalSoftwareKeyboardController.current
    val focusManager = LocalFocusManager.current

    // Accent color animated based on mode
    val activeColor by animateColorAsState(
        targetValue = when (currentMode) {
            TimerMode.FOCUS -> ModeFocusColor
            TimerMode.SHORT_BREAK -> ModeShortBreakColor
            TimerMode.LONG_BREAK -> ModeLongBreakColor
        },
        animationSpec = tween(durationMillis = 350),
        label = "ModeColorTransition"
    )

    // Countdown coroutine engine
    LaunchedEffect(isRunning, timeLeftSeconds) {
        if (isRunning && timeLeftSeconds > 0) {
            delay(1000L)
            timeLeftSeconds -= 1
            if (timeLeftSeconds <= 0) {
                isRunning = false
                if (currentMode == TimerMode.FOCUS) {
                    completedSessionsToday += 1
                }
            }
        }
    }

    // Helper: Mode switch
    fun switchMode(mode: TimerMode) {
        currentMode = mode
        isRunning = false
        val seconds = mode.defaultMinutes * 60
        totalSeconds = seconds
        timeLeftSeconds = seconds
    }

    // Helper: Reset timer
    fun resetTimer() {
        isRunning = false
        timeLeftSeconds = totalSeconds
    }

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .navigationBarsPadding()
            .imePadding(),
        topBar = {
            TopAppBar(
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(10.dp)
                                .clip(CircleShape)
                                .background(activeColor)
                        )
                        Text(
                            text = "FocusFlow",
                            fontWeight = FontWeight.Bold,
                            fontSize = 20.sp,
                            letterSpacing = 0.5.sp
                        )
                    }
                },
                actions = {
                    SessionBadge(count = completedSessionsToday, activeColor = activeColor)
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                    titleContentColor = MaterialTheme.colorScheme.onBackground
                )
            )
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // 1. Presets Selector Row
            item {
                PresetSelector(
                    selectedMode = currentMode,
                    activeColor = activeColor,
                    onModeSelected = { switchMode(it) }
                )
            }

            // 2. Circular Timer Dial Card
            item {
                TimerCard(
                    timeLeftSeconds = timeLeftSeconds,
                    totalSeconds = totalSeconds,
                    isRunning = isRunning,
                    mode = currentMode,
                    accentColor = activeColor,
                    onTogglePlay = { isRunning = !isRunning },
                    onReset = { resetTimer() }
                )
            }

            // 3. Daily Stats Summary
            item {
                DailyStatsSummary(
                    completedSessions = completedSessionsToday,
                    totalTasks = tasks.size,
                    completedTasks = tasks.count { it.isCompleted },
                    accentColor = activeColor
                )
            }

            // 4. Task Input Bar
            item {
                TaskInputField(
                    value = newTaskText,
                    onValueChange = { newTaskText = it },
                    accentColor = activeColor,
                    onAddTask = {
                        val trimmed = newTaskText.trim()
                        if (trimmed.isNotEmpty()) {
                            tasks.add(
                                0,
                                TaskItem(
                                    id = System.currentTimeMillis(),
                                    text = trimmed,
                                    isCompleted = false
                                )
                            )
                            newTaskText = ""
                            keyboardController?.hide()
                            focusManager.clearFocus()
                        }
                    }
                )
            }

            // 5. Tasks List Header
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Today's Tasks (\${tasks.count { it.isCompleted }}/\${tasks.size})",
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 16.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    if (tasks.any { it.isCompleted }) {
                        TextButton(
                            onClick = { tasks.removeAll { it.isCompleted } },
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Text(
                                text = "Clear Done",
                                fontSize = 13.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            // 6. Task List Items
            if (tasks.isEmpty()) {
                item {
                    EmptyTasksPlaceholder()
                }
            } else {
                items(
                    items = tasks,
                    key = { it.id }
                ) { task ->
                    TaskRow(
                        task = task,
                        accentColor = activeColor,
                        onCheckedChange = { isChecked ->
                            val index = tasks.indexOfFirst { it.id == task.id }
                            if (index != -1) {
                                tasks[index] = tasks[index].copy(isCompleted = isChecked)
                            }
                        },
                        onDelete = {
                            tasks.removeAll { it.id == task.id }
                        }
                    )
                }
            }

            // Bottom breathing room
            item {
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

@Composable
fun SessionBadge(count: Int, activeColor: Color) {
    Surface(
        shape = RoundedCornerShape(16.dp),
        color = MaterialTheme.colorScheme.surfaceVariant,
        modifier = Modifier.padding(end = 12.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(text = "⚡", fontSize = 14.sp)
            Text(
                text = "$count Focus \${if (count == 1) "Session" else "Sessions"}",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = activeColor
            )
        }
    }
}

@Composable
fun PresetSelector(
    selectedMode: TimerMode,
    activeColor: Color,
    onModeSelected: (TimerMode) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant)
            .padding(4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        TimerMode.values().forEach { mode ->
            val isSelected = mode == selectedMode
            val backgroundColor by animateColorAsState(
                targetValue = if (isSelected) activeColor else Color.Transparent,
                animationSpec = tween(durationMillis = 200),
                label = "PresetBgColor"
            )
            val textColor by animateColorAsState(
                targetValue = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                animationSpec = tween(durationMillis = 200),
                label = "PresetTextColor"
            )

            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(12.dp))
                    .background(backgroundColor)
                    .clickable { onModeSelected(mode) }
                    .padding(vertical = 10.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "\${mode.title} (\${mode.defaultMinutes}m)",
                    color = textColor,
                    fontSize = 12.sp,
                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}

@Composable
fun TimerCard(
    timeLeftSeconds: Int,
    totalSeconds: Int,
    isRunning: Boolean,
    mode: TimerMode,
    accentColor: Color,
    onTogglePlay: () -> Unit,
    onReset: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(elevation = 6.dp, shape = RoundedCornerShape(28.dp)),
        shape = RoundedCornerShape(28.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 28.dp, horizontal = 20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = when (mode) {
                    TimerMode.FOCUS -> "STAY DEEPLY IMMERSED"
                    TimerMode.SHORT_BREAK -> "TAKE A BREATH & HYDRATE"
                    TimerMode.LONG_BREAK -> "RESTORE YOUR ENERGY"
                },
                fontSize = 11.sp,
                letterSpacing = 1.8.sp,
                fontWeight = FontWeight.Bold,
                color = accentColor.copy(alpha = 0.9f)
            )

            Spacer(modifier = Modifier.height(20.dp))

            val progress = if (totalSeconds > 0) {
                (timeLeftSeconds.toFloat() / totalSeconds.toFloat()).coerceIn(0f, 1f)
            } else 0f

            val animatedProgress by animateFloatAsState(
                targetValue = progress,
                animationSpec = tween(durationMillis = 500, easing = FastOutSlowInEasing),
                label = "TimerProgress"
            )

            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.size(240.dp)
            ) {
                val trackColor = MaterialTheme.colorScheme.surfaceVariant
                Canvas(modifier = Modifier.fillMaxSize()) {
                    val strokeWidth = 14.dp.toPx()
                    val diameter = size.minDimension - strokeWidth
                    val topLeft = Offset(strokeWidth / 2f, strokeWidth / 2f)
                    val arcSize = Size(diameter, diameter)

                    drawArc(
                        color = trackColor,
                        startAngle = 0f,
                        sweepAngle = 360f,
                        useCenter = false,
                        topLeft = topLeft,
                        size = arcSize,
                        style = Stroke(width = strokeWidth)
                    )

                    val sweepAngle = 360f * animatedProgress
                    if (sweepAngle > 0f) {
                        drawArc(
                            color = accentColor,
                            startAngle = -90f,
                            sweepAngle = sweepAngle,
                            useCenter = false,
                            topLeft = topLeft,
                            size = arcSize,
                            style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                        )
                    }
                }

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    val minutes = timeLeftSeconds / 60
                    val seconds = timeLeftSeconds % 60
                    val formattedTime = String.format(Locale.getDefault(), "%02d:%02d", minutes, seconds)

                    Text(
                        text = formattedTime,
                        fontSize = 46.sp,
                        fontWeight = FontWeight.Black,
                        fontFamily = FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.onSurface,
                        letterSpacing = 2.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = if (isRunning) "Running" else if (timeLeftSeconds == 0) "Finished!" else "Ready",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Row(
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(
                    onClick = onReset,
                    modifier = Modifier
                        .size(52.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.surfaceVariant),
                    colors = IconButtonDefaults.iconButtonColors(
                        contentColor = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                ) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = "Reset Timer",
                        modifier = Modifier.size(22.dp)
                    )
                }

                Button(
                    onClick = onTogglePlay,
                    modifier = Modifier
                        .height(52.dp)
                        .width(160.dp),
                    shape = RoundedCornerShape(26.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = accentColor,
                        contentColor = Color.White
                    ),
                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 4.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        if (isRunning) {
                            PauseIconCanvas(color = Color.White)
                        } else {
                            PlayIconCanvas(color = Color.White)
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (isRunning) "Pause" else "Start",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun PlayIconCanvas(color: Color) {
    Canvas(modifier = Modifier.size(16.dp)) {
        val path = Path().apply {
            moveTo(2.dp.toPx(), 0f)
            lineTo(size.width, size.height / 2f)
            lineTo(2.dp.toPx(), size.height)
            close()
        }
        drawPath(path = path, color = color)
    }
}

@Composable
fun PauseIconCanvas(color: Color) {
    Canvas(modifier = Modifier.size(16.dp)) {
        val barWidth = 4.dp.toPx()
        drawRect(
            color = color,
            topLeft = Offset(1.dp.toPx(), 0f),
            size = Size(barWidth, size.height)
        )
        drawRect(
            color = color,
            topLeft = Offset(size.width - barWidth - 1.dp.toPx(), 0f),
            size = Size(barWidth, size.height)
        )
    }
}

@Composable
fun DailyStatsSummary(
    completedSessions: Int,
    totalTasks: Int,
    completedTasks: Int,
    accentColor: Color
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Card(
            modifier = Modifier.weight(1f),
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = "FOCUS CYCLES",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "$completedSessions",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = accentColor
                )
                Text(
                    text = "\${completedSessions * 25} focused mins",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        Card(
            modifier = Modifier.weight(1f),
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    text = "TASKS DONE",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "$completedTasks / $totalTasks",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                val percent = if (totalTasks > 0) (completedTasks * 100 / totalTasks) else 0
                Text(
                    text = "$percent% completed",
                    fontSize = 11.sp,
                    color = if (percent == 100 && totalTasks > 0) ModeShortBreakColor else MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun TaskInputField(
    value: String,
    onValueChange: (String) -> Unit,
    accentColor: Color,
    onAddTask: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        color = MaterialTheme.colorScheme.surface
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = value,
                onValueChange = onValueChange,
                placeholder = {
                    Text(
                        text = "Add a task for this session...",
                        fontSize = 14.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                    )
                },
                modifier = Modifier
                    .weight(1f)
                    .padding(end = 4.dp),
                singleLine = true,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                keyboardActions = KeyboardActions(onDone = { onAddTask() }),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color.Transparent,
                    unfocusedBorderColor = Color.Transparent,
                    focusedTextColor = MaterialTheme.colorScheme.onSurface,
                    unfocusedTextColor = MaterialTheme.colorScheme.onSurface
                )
            )

            IconButton(
                onClick = onAddTask,
                enabled = value.isNotBlank(),
                modifier = Modifier
                    .size(42.dp)
                    .clip(CircleShape)
                    .background(if (value.isNotBlank()) accentColor else MaterialTheme.colorScheme.surfaceVariant),
                colors = IconButtonDefaults.iconButtonColors(
                    contentColor = if (value.isNotBlank()) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                )
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = "Add Task",
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}

@Composable
fun TaskRow(
    task: TaskItem,
    accentColor: Color,
    onCheckedChange: (Boolean) -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (task.isCompleted) {
                MaterialTheme.colorScheme.surface.copy(alpha = 0.6f)
            } else {
                MaterialTheme.colorScheme.surface
            }
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onCheckedChange(!task.isCompleted) }
                .padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Checkbox(
                checked = task.isCompleted,
                onCheckedChange = { onCheckedChange(it) },
                colors = CheckboxDefaults.colors(
                    checkedColor = ModeShortBreakColor,
                    uncheckedColor = MaterialTheme.colorScheme.outline
                )
            )

            Spacer(modifier = Modifier.width(8.dp))

            Text(
                text = task.text,
                modifier = Modifier.weight(1f),
                fontSize = 14.sp,
                color = if (task.isCompleted) {
                    MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                } else {
                    MaterialTheme.colorScheme.onSurface
                },
                textDecoration = if (task.isCompleted) TextDecoration.LineThrough else TextDecoration.None,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )

            IconButton(
                onClick = onDelete,
                modifier = Modifier.size(36.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Delete,
                    contentDescription = "Delete task",
                    tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f),
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}

@Composable
fun EmptyTasksPlaceholder() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.4f)
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(28.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(text = "🎯", fontSize = 28.sp)
            Text(
                text = "No tasks planned yet",
                fontWeight = FontWeight.SemiBold,
                fontSize = 15.sp,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = "Write your key goals above to track what you accomplish during your focus blocks.",
                fontSize = 12.sp,
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
`;
