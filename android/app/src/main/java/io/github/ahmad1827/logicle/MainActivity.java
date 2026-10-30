package io.github.ahmad1827.logicle;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Must follow super: it touches the window, which locks in the theme, and BridgeActivity only
        // switches away from the splash theme (which has a title bar) inside onCreate.
        EdgeToEdge.enable(this);
        // Boards are sized to the screen, so the system font size mustn't push them out of shape.
        getBridge().getWebView().getSettings().setTextZoom(100);
    }
}
